import { cache } from "react";
import { createPublicClient, hasSupabaseEnv } from "@/lib/supabase/clients";
import { PUBLIC_BUTTON_COLUMNS, PUBLIC_COLUMNS, rowToCardData, type CardRow } from "./mapper";
import { SLUG_REGEX } from "./slug";
import type { DigitalCardData } from "./types";

export type PublicCardResult =
  | { status: "active"; card: DigitalCardData }
  | { status: "inactive" }
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
      .select(`${PUBLIC_COLUMNS},card_buttons(${PUBLIC_BUTTON_COLUMNS})`)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) return { status: "error" };
    if (data) return { status: "active", card: rowToCardData(data as unknown as CardRow) };

    const { data: inactive, error: rpcError } = await supabase.rpc("card_is_inactive", { p_slug: slug });
    if (rpcError) return { status: "error" };
    return { status: inactive ? "inactive" : "missing" };
  } catch {
    return { status: "error" };
  }
});

export async function listActiveSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data } = await createPublicClient()
      .from("cards")
      .select("slug,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5000);
    return (data ?? []).map((r) => ({ slug: r.slug as string, updatedAt: r.updated_at as string }));
  } catch {
    return [];
  }
}
