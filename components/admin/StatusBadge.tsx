const STYLES = {
  green: "bg-[#e3f3ec] text-[#116149]",
  gray: "bg-[#ececea] text-[#5b5f66]",
  amber: "bg-[#fbeed5] text-[#8a5200]",
  blue: "bg-[#e3ecfb] text-[#1d4d9b]",
} as const;

function Badge({ tone, children }: { tone: keyof typeof STYLES; children: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[tone]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? <Badge tone="green">Activa</Badge> : <Badge tone="gray">Inactiva</Badge>;
}

export function PaidBadge({ paid }: { paid: boolean }) {
  return paid ? <Badge tone="blue">Pagada</Badge> : <Badge tone="amber">Pendiente</Badge>;
}
