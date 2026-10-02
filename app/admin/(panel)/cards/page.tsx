import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ActiveBadge, PaidBadge } from "@/components/admin/StatusBadge";
import { CardRowActions } from "@/components/admin/CardRowActions";
import {
  CARD_FILTERS, CARD_SORTS, listCards, type CardFilter, type CardSort,
} from "@/lib/cards/admin-queries";
import { TEMPLATE_LABELS } from "@/lib/cards/constants";
import { cardUrl } from "@/lib/site";

type SearchParams = { q?: string; filter?: string; sort?: string; page?: string };

const FILTER_LABELS: Record<CardFilter, string> = {
  all: "Todas", active: "Activas", inactive: "Inactivas", paid: "Pagadas", pending: "Pendientes",
};
const SORT_LABELS: Record<CardSort, string> = { date: "Fecha", name: "Nombre", status: "Estado" };

const dateFormat = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" });

export default async function CardsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filter = CARD_FILTERS.find((f) => f === sp.filter) ?? "all";
  const sort = CARD_SORTS.find((s) => s === sp.sort) ?? "date";
  const q = (sp.q ?? "").slice(0, 60);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const result = await listCards({ q, filter, sort, page });

  const href = (patch: Partial<Record<keyof SearchParams, string>>) => {
    const params = new URLSearchParams();
    const merged = { q, filter, sort, page: String(page), ...patch };
    if (!("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === "filter" && v === "all") && !(k === "sort" && v === "date") && !(k === "page" && v === "1")) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/cards?${qs}` : "/admin/cards";
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:text-ink"}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tarjetas <span className="text-base font-normal text-muted">({result.total})</span>
        </h1>
        <Link href="/admin/cards/new" className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> Nueva tarjeta
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <form action="/admin/cards" className="relative max-w-md" role="search">
          <label htmlFor="q" className="sr-only">Buscar tarjetas</label>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="q" name="q" defaultValue={q} placeholder="Buscar por nombre, slug, teléfono o categoría" className="field pl-9" />
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          {sort !== "date" ? <input type="hidden" name="sort" value={sort} /> : null}
        </form>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar">
            {CARD_FILTERS.map((f) => (
              <Link key={f} href={href({ filter: f })} className={chip(f === filter)} aria-current={f === filter ? "true" : undefined}>
                {FILTER_LABELS[f]}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Ordenar">
            <span className="text-xs text-muted">Ordenar:</span>
            {CARD_SORTS.map((s) => (
              <Link key={s} href={href({ sort: s })} className={chip(s === sort)} aria-current={s === sort ? "true" : undefined}>
                {SORT_LABELS[s]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {result.cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {q || filter !== "all" ? "No hay tarjetas que coincidan con la búsqueda." : "Aún no hay tarjetas."}
        </p>
      ) : (
        <div className="rounded-xl border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_5.5rem_5.5rem_5.5rem_6.5rem_auto] items-center gap-4 border-b border-line px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted lg:grid">
            <span>Nombre</span><span>Slug</span><span>Estado</span><span>Pago</span><span>Template</span><span>Fecha</span><span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-line">
            {result.cards.map((card) => (
              <li
                key={card.id}
                className="grid items-center gap-x-4 gap-y-2 px-4 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_5.5rem_5.5rem_5.5rem_6.5rem_auto]"
              >
                <div className="min-w-0">
                  <Link href={`/admin/cards/${card.id}/edit`} className="block truncate text-sm font-medium hover:underline">
                    {card.businessName}
                  </Link>
                  <span className="block truncate text-xs text-muted">{card.category ?? "Sin categoría"}</span>
                </div>
                <span className="truncate text-sm text-muted">/{card.slug}</span>
                <span><ActiveBadge active={card.isActive} /></span>
                <span><PaidBadge paid={card.isPaid} /></span>
                <span className="text-sm text-muted">{TEMPLATE_LABELS[card.template]}</span>
                <span className="text-sm text-muted">{dateFormat.format(new Date(card.createdAt))}</span>
                <div className="lg:justify-self-end">
                  <CardRowActions card={card} url={cardUrl(card.slug)} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.pageCount > 1 ? (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
          <Link
            href={href({ page: String(page - 1) })}
            aria-disabled={page <= 1}
            className={`btn btn-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Anterior
          </Link>
          <span className="text-muted">Página {result.page} de {result.pageCount}</span>
          <Link
            href={href({ page: String(page + 1) })}
            aria-disabled={page >= result.pageCount}
            className={`btn btn-sm ${page >= result.pageCount ? "pointer-events-none opacity-50" : ""}`}
          >
            Siguiente
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
