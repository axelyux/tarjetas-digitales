"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/clients";
import { getCardById } from "./admin-queries";
import { adminCardToInput, inputButtonsToRows, inputToRow } from "./mapper";
import { cardInputSchema, uuidSchema, type CardInput } from "./schema";
import { nextSlug } from "./slug";
import { EXTENSIONS, validateImage } from "./upload-validation";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; suggestedSlug?: string };

const fail = (error: string, extra?: Partial<Extract<ActionResult, { ok: false }>>) =>
  ({ ok: false as const, error, ...extra });

const GENERIC_ERROR = "No se pudo completar la operación. Intenta de nuevo.";
const UNAUTHORIZED = "Sesión no válida";

function revalidateCard(...slugs: (string | undefined)[]) {
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/cards");
  revalidatePath("/sitemap.xml");
}

function zodFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = await createAdminClient();
  let q = supabase.from("cards").select("id", { head: true, count: "exact" }).eq("slug", slug);
  if (exceptId) q = q.neq("id", exceptId);
  const { count } = await q;
  return (count ?? 0) > 0;
}

async function freeSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    if (!(await slugExists(candidate))) return candidate;
    candidate = nextSlug(candidate);
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createCard(raw: CardInput): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return fail("Revisa los campos marcados", { fieldErrors: zodFieldErrors(parsed.error) });
  const input = parsed.data;

  if (await slugExists(input.slug)) {
    const suggestion = await freeSlug(input.slug);
    return fail("Ese slug ya está en uso", {
      fieldErrors: { slug: `Ya existe. Prueba ${suggestion}` },
      suggestedSlug: suggestion,
    });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("cards").insert(inputToRow(input));
  if (error) {
    if (error.code === "23505") return fail("Ese slug ya está en uso", { fieldErrors: { slug: "Ya existe" } });
    return fail(GENERIC_ERROR);
  }

  if (input.buttons.length > 0) {
    const { error: btnError } = await supabase.from("card_buttons").insert(inputButtonsToRows(input.id, input.buttons));
    if (btnError) {
      await supabase.from("cards").delete().eq("id", input.id);
      return fail(GENERIC_ERROR);
    }
  }

  revalidateCard(input.slug);
  return { ok: true, data: { id: input.id, slug: input.slug } };
}

export async function updateCard(raw: CardInput): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  const parsed = cardInputSchema.safeParse(raw);
  if (!parsed.success) return fail("Revisa los campos marcados", { fieldErrors: zodFieldErrors(parsed.error) });
  const input = parsed.data;

  const existing = await getCardById(input.id);
  if (!existing) return fail("La tarjeta no existe");

  if (input.slug !== existing.slug && (await slugExists(input.slug, input.id))) {
    return fail("Ese slug ya está en uso", { fieldErrors: { slug: "Ya existe otra tarjeta con ese slug" } });
  }

  const supabase = await createAdminClient();
  const { id, ...row } = inputToRow(input);
  const { error } = await supabase.from("cards").update(row).eq("id", id);
  if (error) {
    if (error.code === "23505") return fail("Ese slug ya está en uso", { fieldErrors: { slug: "Ya existe" } });
    return fail(GENERIC_ERROR);
  }

  const { error: delError } = await supabase.from("card_buttons").delete().eq("card_id", id);
  if (delError) return fail(GENERIC_ERROR);
  if (input.buttons.length > 0) {
    const { error: btnError } = await supabase.from("card_buttons").insert(inputButtonsToRows(id, input.buttons));
    if (btnError) return fail(GENERIC_ERROR);
  }

  revalidateCard(existing.slug, input.slug);
  return { ok: true, data: { id, slug: input.slug } };
}

export async function duplicateCard(id: string): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const source = await getCardById(id);
  if (!source) return fail("La tarjeta no existe");

  const newId = crypto.randomUUID();
  const slug = await freeSlug(source.slug);
  const suffix = /-(\d+)$/.exec(slug)?.[1];
  const baseName = source.businessName.replace(/\s+\d+$/, "");
  const businessName = `${baseName} ${suffix ?? "2"}`.slice(0, 80);

  const supabase = await createAdminClient();
  const row = inputToRow({
    ...adminCardToInput(source),
    id: newId,
    slug,
    businessName,
    isActive: false,
    isPaid: false,
  });
  const { error } = await supabase.from("cards").insert(row);
  if (error) return fail(GENERIC_ERROR);

  if (source.buttons.length > 0) {
    const { error: btnError } = await supabase.from("card_buttons").insert(
      inputButtonsToRows(newId, source.buttons.map((b) => ({ label: b.label, url: b.url, icon: b.icon, isActive: b.isActive }))),
    );
    if (btnError) {
      await supabase.from("cards").delete().eq("id", newId);
      return fail(GENERIC_ERROR);
    }
  }

  revalidateCard(slug);
  return { ok: true, data: { id: newId, slug } };
}

async function updateFlag(id: string, patch: { is_active: boolean } | { is_paid: boolean }): Promise<ActionResult> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("cards").update(patch).eq("id", id).select("slug").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);
  revalidateCard(data.slug as string);
  return { ok: true, data: undefined };
}

export async function setCardActive(id: string, isActive: boolean): Promise<ActionResult> {
  return updateFlag(id, { is_active: isActive });
}

export async function setCardPaid(id: string, isPaid: boolean): Promise<ActionResult> {
  return updateFlag(id, { is_paid: isPaid });
}

async function removeFolder(cardId: string, onlyPrefix?: string) {
  const supabase = await createAdminClient();
  const bucket = supabase.storage.from("card-assets");
  const { data: files } = await bucket.list(cardId, { limit: 100 });
  const paths = (files ?? [])
    .filter((f) => !onlyPrefix || f.name.startsWith(onlyPrefix))
    .map((f) => `${cardId}/${f.name}`);
  if (paths.length > 0) await bucket.remove(paths);
}

export async function deleteCard(id: string): Promise<ActionResult> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);
  if (!uuidSchema.safeParse(id).success) return fail("ID inválido");
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("cards").delete().eq("id", id).select("slug").maybeSingle();
  if (error || !data) return fail(GENERIC_ERROR);
  await removeFolder(id).catch(() => undefined);
  revalidateCard(data.slug as string);
  return { ok: true, data: undefined };
}

const UPLOAD_KINDS = ["logo", "cover", "background"] as const;

/** Sube una imagen a Storage: card-assets/{cardId}/{kind}-{timestamp}.{ext}. Devuelve la URL publica. */
export async function uploadCardAsset(formData: FormData): Promise<ActionResult<{ url: string }>> {
  if (!(await getAdminSession())) return fail(UNAUTHORIZED);

  const cardId = uuidSchema.safeParse(formData.get("cardId"));
  const kind = UPLOAD_KINDS.find((k) => k === formData.get("kind"));
  const file = formData.get("file");
  if (!cardId.success || !kind || !(file instanceof File)) return fail("Solicitud inválida");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateImage(bytes, file.type);
  if (!check.ok) return fail(check.error);

  const supabase = await createAdminClient();
  const bucket = supabase.storage.from("card-assets");
  await removeFolder(cardId.data, `${kind}-`).catch(() => undefined);

  const path = `${cardId.data}/${kind}-${Date.now()}.${EXTENSIONS[check.type]}`;
  const { error } = await bucket.upload(path, bytes, { contentType: check.type, cacheControl: "31536000", upsert: false });
  if (error) return fail("No se pudo subir la imagen");

  return { ok: true, data: { url: bucket.getPublicUrl(path).data.publicUrl } };
}
