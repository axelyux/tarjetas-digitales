import "server-only";
import { createAdminClient } from "@/lib/supabase/clients";
import { PAGE_SIZE } from "./constants";
import { LIST_COLUMNS, rowToAdminCard, rowToListItem, type CardRow } from "./mapper";
import { uuidSchema } from "./schema";
import type { AdminCard, AdminListItem } from "./types";

export const CARD_FILTERS = ["all", "active", "inactive", "draft", "pending", "paid", "archived"] as const;
export const CARD_SORTS = ["newest", "oldest", "name", "status"] as const;
export type CardFilter = (typeof CARD_FILTERS)[number];
export type CardSort = (typeof CARD_SORTS)[number];

export type CardListParams = { q?: string; filter?: CardFilter; sort?: CardSort; page?: number };
export type CardListResult = { cards: AdminListItem[]; total: number; page: number; pageCount: number };

/** Quita caracteres con significado en filtros PostgREST / LIKE. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()%*_\\"'.:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function listCards(params: CardListParams): Promise<CardListResult> {
  const supabase = await createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("cards").select(LIST_COLUMNS, { count: "exact" });

  const q = sanitizeSearch(params.q ?? "");
  if (q) {
    const conditions = ["business_name", "slug", "category", "customer_name"].map((c) => `${c}.ilike.%${q}%`);
    // Telefonos viven en card_actions: busca por digitos y agrega las tarjetas encontradas.
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 4) {
      const { data: hits } = await supabase
        .from("card_actions")
        .select("card_id")
        .in("type", ["phone", "whatsapp"])
        .ilike("value", `%${digits}%`)
        .limit(200);
      const ids = [...new Set((hits ?? []).map((h) => h.card_id as string))];
      if (ids.length > 0) conditions.push(`id.in.(${ids.join(",")})`);
    }
    query = query.or(conditions.join(","));
  }

  switch (params.filter) {
    case "active": query = query.eq("publication_status", "active"); break;
    case "inactive": query = query.eq("publication_status", "inactive"); break;
    case "draft": query = query.in("publication_status", ["draft", "preview"]); break;
    case "archived": query = query.eq("publication_status", "archived"); break;
    case "paid": query = query.eq("payment_status", "paid").neq("publication_status", "archived"); break;
    case "pending": query = query.eq("payment_status", "pending").neq("publication_status", "archived"); break;
    default: query = query.neq("publication_status", "archived");
  }

  switch (params.sort) {
    case "oldest": query = query.order("created_at", { ascending: true }); break;
    case "name": query = query.order("business_name", { ascending: true }); break;
    case "status":
      query = query.order("publication_status", { ascending: true }).order("created_at", { ascending: false });
      break;
    default: query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error("No se pudieron cargar las tarjetas");
  const total = count ?? 0;
  return {
    cards: ((data ?? []) as unknown as CardRow[]).map(rowToListItem),
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
    .select("*, card_actions(*), card_branches(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToAdminCard(data as unknown as CardRow);
}

export type DashboardStats = {
  total: number; active: number; inactive: number; draft: number; paid: number; pending: number; archived: number;
};

export async function getStats(): Promise<DashboardStats> {
  const supabase = await createAdminClient();
  const base = () => supabase.from("cards").select("id", { count: "exact", head: true });
  const [all, active, inactive, draft, archived, paid, pending] = await Promise.all([
    base(),
    base().eq("publication_status", "active"),
    base().eq("publication_status", "inactive"),
    base().in("publication_status", ["draft", "preview"]),
    base().eq("publication_status", "archived"),
    base().eq("payment_status", "paid").neq("publication_status", "archived"),
    base().eq("payment_status", "pending").neq("publication_status", "archived"),
  ]);
  const n = (r: { count: number | null }) => r.count ?? 0;
  const total = n(all) - n(archived);
  return {
    total, active: n(active), inactive: n(inactive), draft: n(draft), archived: n(archived),
    paid: n(paid), pending: n(pending),
  };
}

export async function getRecentCards(limit = 5): Promise<AdminListItem[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("cards")
    .select(LIST_COLUMNS)
    .neq("publication_status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as CardRow[]).map(rowToListItem);
}
