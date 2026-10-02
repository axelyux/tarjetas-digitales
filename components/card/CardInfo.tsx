import { Clock, Info, MapPin } from "lucide-react";
import type { DigitalCardData } from "@/lib/cards/types";

type Props = {
  data: Pick<DigitalCardData, "address" | "schedule" | "extraInfo">;
  /** "list": filas con icono. "plain": etiquetas en texto (templates editoriales). */
  variant?: "list" | "plain";
  className?: string;
};

export function CardInfo({ data, variant = "list", className = "" }: Props) {
  const items = [
    data.address ? { key: "address", label: "Dirección", value: data.address, Icon: MapPin } : null,
    data.schedule ? { key: "schedule", label: "Horario", value: data.schedule, Icon: Clock } : null,
    data.extraInfo ? { key: "extra", label: "Información", value: data.extraInfo, Icon: Info } : null,
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  if (items.length === 0) return null;

  if (variant === "plain") {
    return (
      <dl className={`flex flex-col gap-4 ${className}`}>
        {items.map((item) => (
          <div key={item.key}>
            <dt className="cd-muted text-[0.7rem] font-semibold uppercase tracking-[0.16em]">{item.label}</dt>
            <dd className="mt-1 whitespace-pre-line text-[0.95rem]">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <ul className={`flex flex-col gap-3 ${className}`}>
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-3 text-[0.92rem]">
          <item.Icon size={18} strokeWidth={1.9} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--card-accent)]" />
          <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">
            <span className="sr-only">{item.label}: </span>
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
