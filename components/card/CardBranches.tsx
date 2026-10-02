import { MapPin, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { resolveActionHref } from "@/lib/cards/action-types";
import { formatHours } from "@/lib/cards/hours";
import type { DigitalCardData } from "@/lib/cards/types";

export function hasBranches(data: Pick<DigitalCardData, "branches">): boolean {
  return data.branches.length > 0;
}

/** Sucursales: cada una con su dirección, horario y accesos (mapa, llamada, WhatsApp). */
export function CardBranches({ data }: { data: Pick<DigitalCardData, "branches"> }) {
  if (!hasBranches(data)) return null;
  return (
    <section aria-label="Sucursales" className="flex flex-col gap-3">
      <h2 className="cd-muted text-[0.7rem] font-semibold uppercase tracking-[0.16em]">Sucursales</h2>
      {data.branches.map((b) => {
        const maps = b.mapsUrl ? resolveActionHref("maps", b.mapsUrl) : b.address ? resolveActionHref("maps", b.address) : null;
        const tel = b.phone ? resolveActionHref("phone", b.phone) : null;
        const wa = b.whatsapp ? resolveActionHref("whatsapp", b.whatsapp) : null;
        const hours = formatHours(b.hours);
        return (
          <article
            key={b.id}
            className="flex flex-col gap-2.5 rounded-[var(--card-radius)] border border-[color-mix(in_srgb,var(--card-text)_16%,transparent)] p-4"
          >
            <h3 className="text-[1rem] font-semibold leading-snug [overflow-wrap:anywhere]">{b.name}</h3>
            {b.address ? <p className="cd-muted text-[0.9rem] [overflow-wrap:anywhere]">{b.address}</p> : null}
            {hours.length > 0 ? (
              <details className="text-[0.88rem]">
                <summary className="cursor-pointer font-medium">Horario</summary>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {hours.map((l) => (
                    <li key={l.days} className="flex justify-between gap-4">
                      <span>{l.days}</span>
                      <span className="tabular-nums">{l.text}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {maps || tel || wa ? (
              <div className="flex flex-wrap gap-2">
                {maps ? (
                  <a className="cd-chip" href={maps} target="_blank" rel="noopener noreferrer">
                    <MapPin size={16} aria-hidden="true" /> Cómo llegar
                  </a>
                ) : null}
                {tel ? (
                  <a className="cd-chip" href={tel}>
                    <Phone size={16} aria-hidden="true" /> Llamar
                  </a>
                ) : null}
                {wa ? (
                  <a className="cd-chip" href={wa} target="_blank" rel="noopener noreferrer">
                    <SiWhatsapp size={16} aria-hidden="true" /> WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
