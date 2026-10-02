import "server-only";
import { createAdminClient } from "@/lib/supabase/clients";
import { PAGE_SIZE } from "./constants";
import { rowToAdminCard, type CardRow } from "./mapper";
import { uuidSchema } from "./schema";
import type { AdminCard } from "./types";

export const CARD_FILTERS = ["all", "active", "inactive", "paid", "pending"] as const;
export const CARD_SORTS = ["date", "name", "status"] as const;
export type CardFilter = (typeof CARD_FILTERS)[number];
export type CardSort = (typeof CARD_SORTS)[number];

export type CardListParams = { q?: string; filter?: CardFilter; sort?: CardSort; page?: number };

export type CardListResult = { cards: AdminCard[]; total: number; page: number; pageCount: number };

/** Quita caracteres con significado en filtros PostgREST / LIKE. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()%*_\\"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function listCards(params: CardListParams): Promise<CardListResult> {
  const supabase = await createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("cards").select("*, card_buttons(id)", { count: "exact" });

  const q = sanitizeSearch(params.q ?? "");
  if (q) {
    query = query.or(
      ["business_name", "slug", "phone", "whatsapp", "category"].map((c) => `${c}.ilike.%${q}%`).join(","),
    );
  }

  switch (params.filter) {
    case "active": query = query.eq("is_active", true); break;
    case "inactive": query = query.eq("is_active", false); break;
    case "paid": query = query.eq("is_paid", true); break;
    case "pending": query = query.eq("is_paid", false); break;
    default: break;
  }

  switch (params.sort) {
    case "name":
      query = query.order("business_name", { ascending: true });
      break;
    case "status":
      query = query.order("is_active", { ascending: false }).order("is_paid", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error("No se pudieron cargar las tarjetas");
  const total = count ?? 0;
  return {
    cards: ((data ?? []) as unknown as CardRow[]).map(rowToAdminCard),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCardById(id: string): Promise<AdminCard | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*, card_buttons(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToAdminCard(data as unknown as CardRow);
}

export type DashboardStats = { total: number; active: number; inactive: number; paid: number; pending: number };

export async function getStats(): Promise<DashboardStats> {
  const supabase = await createAdminClient();
  const count = async (apply?: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const q = apply ? apply(base()) : base();
    const { count: c } = await q;
    return c ?? 0;
  };
  const base = () => supabase.from("cards").select("id", { count: "exact", head: true });
  const [total, active, paid] = await Promise.all([
    count(),
    count((q) => q.eq("is_active", true)),
    count((q) => q.eq("is_paid", true)),
  ]);
  return { total, active, inactive: total - active, paid, pending: total - paid };
}

export async function getRecentCards(limit = 5): Promise<AdminCard[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as CardRow[]).map(rowToAdminCard);
}
