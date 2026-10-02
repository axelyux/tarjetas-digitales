import Link from "next/link";
import { Plus } from "lucide-react";
import { ActiveBadge, PaidBadge } from "@/components/admin/StatusBadge";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { getRecentCards, getStats } from "@/lib/cards/admin-queries";
import { TEMPLATE_LABELS } from "@/lib/cards/constants";

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([getStats(), getRecentCards(6)]);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <div className="flex gap-2">
          <Link href="/admin/cards" className="btn">
            Ver tarjetas
          </Link>
          <Link href="/admin/cards/new" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" /> Nueva tarjeta
          </Link>
        </div>
      </div>

      <DashboardStats stats={stats} />

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="mb-3 text-sm font-semibold">
          Últimas tarjetas creadas
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Aún no hay tarjetas. Crea la primera en menos de 3 minutos.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {recent.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/admin/cards/${card.id}/edit`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-paper"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{card.businessName}</span>
                    <span className="block truncate text-xs text-muted">
                      /{card.slug} · {TEMPLATE_LABELS[card.template]}
                    </span>
                  </span>
                  <ActiveBadge active={card.isActive} />
                  <PaidBadge paid={card.isPaid} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
