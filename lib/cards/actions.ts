"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/clients";
import { getCardById } from "./admin-queries";
import { PAYMENT_STATUSES, PUBLICATION_STATUSES, type PaymentStatus, type PublicationStatus } from "./constants";
import { adminCardToInput, inputToActionRows, inputToBranchRows, inputToCardRow } from "./mapper";
import { cardInputSchema, uuidSchema, type CardInput } from "./schema";
import { nextSlug } from "./slug";
import { EXTENSIONS, extensionMatches, validateUpload } from "./upload-validation";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; suggestedSlug?: string; conflict?: boolean };

type Failure = Extract<ActionResult, { ok: false }>;
const fail = (error: string, extra?: Partial<Failure>): Failure => ({ ok: false, error, ...extra });

const GENERIC_ERROR = "No se pudo completar la operación. Intenta de nuevo.";
const UNAUTHORIZED = "Tu sesión no es válida. Vuelve a iniciar sesión.";
const MAX_CREATES_PER_MINUTE = 20;
const BUCKET = "card-assets";

type Supabase = Awaited<ReturnType<typeof createAdminClient>>;

function revalidateCard(...slugs: (string | undefined)[]) {
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/cards");
  revalidatePath("/sitemap.xml");
}

function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function audit(supabase: Supabase, cardId: string, action: string, details?: Record<string, unknown>) {
  try {
    await supabase.from("card_audit").insert({ card_id: cardId, action, details: details ?? null });
  } catch {
    // La auditoría nunca debe romper la operación principal.
  }
}

async function slugTaken(supabase: Supabase, slug: string, exceptId?: string): Promise<boolean> {
  let cards = supabase.from("cards").select("id", { head: true, count: "exact" }).eq("slug", slug);
  if (exceptId) cards = cards.neq("id", exceptId);
  const aliases = supabase.from("card_slug_aliases").select("slug", { head: true, count: "exact" }).eq("slug", slug);
  const [c, a] = await Promise.all([cards, aliases]);
  return (c.count ?? 0) > 0 || (a.count ?? 0) > 0;
}

async function freeSlug(supabase: Supabase, base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    if (!(await slugTaken(supabase, candidate))) return candidate;
    candidate = nextSlug(candidate);
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function creationRateExceeded(supabase: Supabase): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase.from("cards").select("id", { head: true, count: "exact" }).gte("created_at", since);
  return (count ?? 0) >= MAX_CREATES_PER_MINUTE;
}

/** Ruta dentro de card-assets a partir de su URL publica (solo si pertenece a esta tarjeta). */
function assetPath(url: string, cardId: string): string | null {
  const marker = `/${BUCKET}/${cardId}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const name = url.slice(i + marker.length).split(/[?#]/)[0] ?? "";
  return /^[\w.-]+$/.test(name) ? `${cardId}/${name}` : null;
}

/** Borra de Storage lo que la tarjeta ya no referencia (logo/portada/fondo/PDF reemplazados). */
async function cleanupAssets(supabase: Supabase, cardId: string, input: CardInput) {
  try {
    const referenced = new Set(
      [input.logoUrl, input.coverImageUrl, input.backgroundImageUrl, ...input.actions.map((a) => a.value)]
        .map((u) => assetPath(u, cardId))
        .filter((p): p is string => p !== null),
    );
    const bucket = supabase.storage.from(BUCKET);
    const { data: files } = await bucket.list(cardId, { limit: 200 });
    const stale = (files ?? []).map((f) => `${cardId}/${f.name}`).filter((p) => !referenced.has(p));
    if (stale.length > 0) await bucket.remove(stale);
  } catch {
    // Mejor un archivo huérfano que fallar el guardado.
  }
}

async function removeFolder(supabase: Supabase, cardId: string) {
  const bucket = supabase.storage.from(BUCKET);
  const { data: files } = await bucket.list(cardId, { limit: 200 });
  const paths = (files ?? []).map((f) => `${cardId}/${f.name}`);
  if (paths.length > 0) await bucket.remove(paths);
}

export type SaveData = { id: string; slug: string; updatedAt: string; replayed: boolean };

/**
 * Crea o actualiza una tarjeta de forma atómica (tarjeta + acciones + sucursales en una transacción).
 * - create: idempotente por id (doble clic / reintento no duplica).
 * - update: concurrencia optimista con `expectedUpdatedAt`.
 */
export async function saveCard(
  mode: "create" | "update",
  raw: CardInput,
  expectedUpdatedAt?: string,
): Promise<ActionResult<SaveData>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return fail("Revisa los campos marcados", { fieldErrors: zodFieldErrors(parsed.error) });
  const input = parsed.data;
  if (mode === "update" && !expectedUpdatedAt) return fail(GENERIC_ERROR);

  const supabase = await createAdminClient();
  if (mode === "create" && (await creationRateExceeded(supabase))) {
    return fail("Demasiadas tarjetas creadas en poco tiempo. Espera un minuto.");
  }

  try {
    const { data, error } = await supabase.rpc("save_card", {
      p_mode: mode,
      p_card: inputToCardRow(input),
      p_actions: inputToActionRows(input.actions),
      p_branches: inputToBranchRows(input.branches),
      p_expected: mode === "update" ? expectedUpdatedAt : null,
    });

    if (error) {
      const text = `${error.code ?? ""} ${error.message ?? ""}`;
      if (error.code === "23505" || text.includes("slug_taken")) {
        const suggestion = await freeSlug(supabase, input.slug);
        return fail("Ese slug ya está en uso", {
          fieldErrors: { slug: `Ya existe. Prueba ${suggestion}` },
          suggestedSlug: suggestion,
        });
      }
      if (text.includes("card_conflict")) {
        return fail(
          "Esta tarjeta cambió en otra sesión. Recarga la página para ver la versión actual; tus cambios no se guardaron.",
          { conflict: true },
        );
      }
      if (text.includes("card_missing")) return fail("La tarjeta ya no existe.");
      if (text.includes("forbidden")) return fail(UNAUTHORIZED);
      console.error("[saveCard]", error.code, error.message);
      return fail(GENERIC_ERROR);
    }

    const result = data as { id: string; slug: string; updated_at: string; replayed: boolean };
    const { data: aliases } = await supabase.from("card_slug_aliases").select("slug").eq("card_id", result.id);
    revalidateCard(result.slug, ...(aliases ?? []).map((a) => a.slug as string));
    if (!result.replayed) await cleanupAssets(supabase, result.id, input);
    return { ok: true, data: { id: result.id, slug: result.slug, updatedAt: result.updated_at, replayed: result.replayed } };
  } catch (e) {
    console.error("[saveCard]", e instanceof Error ? e.message : "unknown");
    return fail(GENERIC_ERROR);
  }
}

/** Copia un asset de Storage a la carpeta de la nueva tarjeta (cada tarjeta es dueña de sus archivos). */
async function copyAsset(supabase: Supabase, url: string, fromId: string, toId: string): Promise<string> {
  const from = assetPath(url, fromId);
  if (!from) return "";
  const to = `${toId}/${from.split("/").pop()}`;
  const bucket = supabase.storage.from(BUCKET);
  const { error } = await bucket.copy(from, to);
  return error ? "" : bucket.getPublicUrl(to).data.publicUrl;
}

export async function duplicateCard(id: string): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const source = await getCardById(id);
  if (!source) return fail("La tarjeta no existe");

  const supabase = await createAdminClient();
  if (await creationRateExceeded(supabase)) return fail("Demasiadas tarjetas creadas en poco tiempo. Espera un minuto.");

  const newId = crypto.randomUUID();
  const slug = await freeSlug(supabase, source.slug);
  const suffix = /-(\d+)$/.exec(slug)?.[1];
  const businessName = `${source.businessName.replace(/\s+\d+$/, "")} ${suffix ?? "2"}`.slice(0, 80);

  const base = adminCardToInput(source);
  const copy = (url: string) => (url ? copyAsset(supabase, url, id, newId) : Promise.resolve(""));
  const [logoUrl, coverImageUrl, backgroundImageUrl] = await Promise.all([
    copy(base.logoUrl), copy(base.coverImageUrl), copy(base.backgroundImageUrl),
  ]);
  const actions = await Promise.all(
    base.actions.map(async (a) => (assetPath(a.value, id) ? { ...a, value: await copyAsset(supabase, a.value, id, newId) } : a)),
  );

  const result = await saveCard("create", {
    ...base, id: newId, slug, businessName, logoUrl, coverImageUrl, backgroundImageUrl,
    actions: actions.filter((a) => a.value),
    publicationStatus: "draft", paymentStatus: "pending",
  });
  if (!result.ok) return result;
  await audit(supabase, newId, "duplicated", { from: id });
  return { ok: true, data: { id: newId, slug: result.data.slug } };
}

async function updateStatus(
  id: string,
  patch: { publication_status: PublicationStatus } | { payment_status: PaymentStatus },
  auditAction: string,
): Promise<ActionResult> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("cards").update(patch).eq("id", id).select("slug").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);
  const { data: aliases } = await supabase.from("card_slug_aliases").select("slug").eq("card_id", id);
  revalidateCard(data.slug as string, ...(aliases ?? []).map((a) => a.slug as string));
  await audit(supabase, id, auditAction, patch);
  return { ok: true, data: undefined };
}

const AUDIT_FOR_STATUS: Record<PublicationStatus, string> = {
  draft: "unpublished", preview: "preview", active: "published", inactive: "unpublished", archived: "archived",
};

export async function setPublicationStatus(id: string, status: PublicationStatus): Promise<ActionResult> {
  if (!PUBLICATION_STATUSES.includes(status)) return fail("Estado inválido");
  return updateStatus(id, { publication_status: status }, AUDIT_FOR_STATUS[status]);
}

export async function setPaymentStatus(id: string, status: PaymentStatus): Promise<ActionResult> {
  if (!PAYMENT_STATUSES.includes(status)) return fail("Estado inválido");
  return updateStatus(id, { payment_status: status }, "payment_changed");
}

/** Eliminación definitiva: solo permitida para tarjetas ya archivadas. */
export async function deleteCard(id: string): Promise<ActionResult> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("cards").delete().eq("id", id).eq("publication_status", "archived").select("slug").maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  if (!data) return fail("Solo se pueden eliminar tarjetas archivadas. Archívala primero.");
  await removeFolder(supabase, id).catch(() => undefined);
  await audit(supabase, id, "deleted", { slug: data.slug });
  revalidateCard(data.slug as string);
  return { ok: true, data: undefined };
}

/** Invalida el enlace de vista previa anterior y genera uno nuevo. */
export async function regeneratePreviewToken(id: string): Promise<ActionResult<{ token: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("cards").update({ preview_token: token }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);
  return { ok: true, data: { token } };
}

const UPLOAD_KINDS = ["logo", "cover", "background", "pdf"] as const;

/** Sube un archivo a Storage: card-assets/{cardId}/{kind}-{timestamp}.{ext}. El nombre cambia en cada subida (sin caché obsoleta). */
export async function uploadCardAsset(formData: FormData): Promise<ActionResult<{ url: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);

  const cardId = uuidSchema.safeParse(formData.get("cardId"));
  const kind = UPLOAD_KINDS.find((k) => k === formData.get("kind"));
  const file = formData.get("file");
  if (!cardId.success || !kind || !(file instanceof File)) return fail("Solicitud inválida");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bytes, file.type, kind === "pdf");
  if (!check.ok) return fail(check.error);
  if (file.name && file.name !== "image.webp" && !extensionMatches(file.name, check.type)) {
    return fail("La extensión del archivo no coincide con su tipo");
  }

  const supabase = await createAdminClient();
  const bucket = supabase.storage.from(BUCKET);
  const path = `${cardId.data}/${kind}-${Date.now()}.${EXTENSIONS[check.type]}`;
  const { error } = await bucket.upload(path, bytes, { contentType: check.type, cacheControl: "31536000", upsert: false });
  if (error) return fail("No se pudo subir el archivo. Intenta nuevamente.");

  return { ok: true, data: { url: bucket.getPublicUrl(path).data.publicUrl } };
}
