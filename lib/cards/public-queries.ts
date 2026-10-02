import { cache } from "react";
import { createPublicClient, hasSupabaseEnv } from "@/lib/supabase/clients";
import { PUBLIC_SELECT, rowToCardData, type CardRow } from "./mapper";
import { SLUG_REGEX } from "./slug";
import type { DigitalCardData } from "./types";

export type PublicCardResult =
  | { status: "active"; card: DigitalCardData }
  | { status: "inactive" }
  | { status: "redirect"; slug: string }
  | { status: "missing" }
  | { status: "error" };

/** Lectura publica (rol anon + RLS). Deduplicada por request con React cache. */
export const getPublicCard = cache(async (slug: string): Promise<PublicCardResult> => {
  if (!SLUG_REGEX.test(slug) || slug.length > 60) return { status: "missing" };
  if (!hasSupabaseEnv()) return { status: "error" };

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("cards")
      .select(PUBLIC_SELECT)
      .eq("slug", slug) // RLS ya limita al rol anon a tarjetas activas (anon no puede filtrar por publication_status)
      .maybeSingle();

    if (error) return { status: "error" };
    if (data) return { status: "active", card: rowToCardData(data as unknown as CardRow) };

    const { data: resolved, error: rpcError } = await supabase.rpc("resolve_card_slug", { p_slug: slug });
    if (rpcError) return { status: "error" };
    if (resolved === "unavailable") return { status: "inactive" };
    if (typeof resolved === "string" && resolved.startsWith("redirect:")) {
      const target = resolved.slice("redirect:".length);
      if (SLUG_REGEX.test(target)) return { status: "redirect", slug: target };
    }
    return { status: "missing" };
  } catch {
    return { status: "error" };
  }
});

export type PreviewResult = { status: "ok"; card: DigitalCardData } | { status: "missing" } | { status: "error" };

/** Vista previa privada por token (RPC security definer; no depende de que la tarjeta este activa). */
export async function getPreviewCard(token: string): Promise<PreviewResult> {
  if (!/^[a-f0-9]{32,80}$/.test(token) || !hasSupabaseEnv()) return { status: "missing" };
  try {
    const { data, error } = await createPublicClient().rpc("get_card_preview", { p_token: token });
    if (error) return { status: "error" };
    if (!data) return { status: "missing" };
    return { status: "ok", card: rowToCardData(data as CardRow) };
  } catch {
    return { status: "error" };
  }
}

export async function listActiveSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await createPublicClient()
      .from("cards")
      .select("slug,updated_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    return (data ?? []).map((r) => ({ slug: r.slug as string, updatedAt: r.updated_at as string }));
  } catch {
    return [];
  }
}
