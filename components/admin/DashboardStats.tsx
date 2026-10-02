import type { DashboardStats as Stats } from "@/lib/cards/admin-queries";

const ITEMS: { key: keyof Stats; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "active", label: "Activas" },
  { key: "inactive", label: "Inactivas" },
  { key: "draft", label: "Borradores" },
  { key: "paid", label: "Pagadas" },
  { key: "pending", label: "Pendientes" },
];

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      {ITEMS.map((item) => (
        <div key={item.key} className="bg-surface px-4 py-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted">{item.label}</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{stats[item.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
