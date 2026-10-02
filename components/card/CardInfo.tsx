import { Clock, Info, MapPin } from "lucide-react";
import { formatHours } from "@/lib/cards/hours";
import type { DigitalCardData } from "@/lib/cards/types";

type Data = Pick<DigitalCardData, "address" | "schedule" | "extraInfo" | "hours">;

export function hasInfo(data: Data): boolean {
  return Boolean(data.address || data.schedule || data.extraInfo || formatHours(data.hours).length > 0);
}

type Props = {
  data: Data;
  /** "list": filas con icono. "plain": etiquetas en texto (templates editoriales). */
  variant?: "list" | "plain";
  className?: string;
};

function HoursLines({ data }: { data: Data }) {
  const lines = formatHours(data.hours);
  return (
    <>
      {lines.length > 0 ? (
        <span className="flex flex-col gap-0.5">
          {lines.map((l) => (
            <span key={l.days} className="flex justify-between gap-4">
              <span>{l.days}</span>
              <span className="text-right tabular-nums">{l.text}</span>
            </span>
          ))}
        </span>
      ) : null}
      {data.schedule ? <span className={`block whitespace-pre-line ${lines.length > 0 ? "cd-muted mt-1 text-[0.85rem]" : ""}`}>{data.schedule}</span> : null}
    </>
  );
}

export function CardInfo({ data, variant = "list", className = "" }: Props) {
  if (!hasInfo(data)) return null;
  const hasHours = Boolean(data.schedule) || formatHours(data.hours).length > 0;

  if (variant === "plain") {
    return (
      <dl className={`flex flex-col gap-4 ${className}`}>
        {data.address ? (
          <div>
            <dt className="cd-muted text-[0.7rem] font-semibold uppercase tracking-[0.16em]">Dirección</dt>
            <dd className="mt-1 whitespace-pre-line text-[0.95rem] [overflow-wrap:anywhere]">{data.address}</dd>
          </div>
        ) : null}
        {hasHours ? (
          <div>
            <dt className="cd-muted text-[0.7rem] font-semibold uppercase tracking-[0.16em]">Horario</dt>
            <dd className="mt-1 text-[0.95rem]"><HoursLines data={data} /></dd>
          </div>
        ) : null}
        {data.extraInfo ? (
          <div>
            <dt className="cd-muted text-[0.7rem] font-semibold uppercase tracking-[0.16em]">Información</dt>
            <dd className="mt-1 whitespace-pre-line text-[0.95rem] [overflow-wrap:anywhere]">{data.extraInfo}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  const row = "flex items-start gap-3 text-[0.92rem]";
  const icon = "mt-0.5 shrink-0 text-[var(--card-accent)]";
  return (
    <ul className={`flex flex-col gap-3 ${className}`}>
      {data.address ? (
        <li className={row}>
          <MapPin size={18} strokeWidth={1.9} aria-hidden="true" className={icon} />
          <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]"><span className="sr-only">Dirección: </span>{data.address}</span>
        </li>
      ) : null}
      {hasHours ? (
        <li className={row}>
          <Clock size={18} strokeWidth={1.9} aria-hidden="true" className={icon} />
          <span className="min-w-0 flex-1"><span className="sr-only">Horario: </span><HoursLines data={data} /></span>
        </li>
      ) : null}
      {data.extraInfo ? (
        <li className={row}>
          <Info size={18} strokeWidth={1.9} aria-hidden="true" className={icon} />
          <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]"><span className="sr-only">Información: </span>{data.extraInfo}</span>
        </li>
      ) : null}
    </ul>
  );
}
