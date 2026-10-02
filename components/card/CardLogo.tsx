import { LOGO_PX } from "@/lib/cards/constants";
import type { DigitalCardData } from "@/lib/cards/types";

const SHAPE_CLASS = { circle: "rounded-full", rounded: "rounded-[22%]", square: "rounded-none" } as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  data: DigitalCardData;
  /** Escala sobre el tamano configurado (p. ej. layout compacto). */
  scale?: number;
  className?: string;
};

export function CardLogo({ data, scale = 1, className = "" }: Props) {
  const px = Math.round(LOGO_PX[data.logoSize] * scale);
  const shape = SHAPE_CLASS[data.logoShape];
  const box = { width: px, height: px };

  if (data.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos pequenos servidos por el CDN de Supabase; evita consumir cuota de optimizacion
      <img
        src={data.logoUrl}
        alt={`Logo de ${data.businessName}`}
        width={px}
        height={px}
        decoding="async"
        className={`shrink-0 bg-white object-cover ring-4 ring-[var(--card-background)] ${shape} ${className}`}
        style={box}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold ring-4 ring-[var(--card-background)] ${shape} ${className}`}
      style={{ ...box, background: "var(--card-primary)", color: "var(--card-on-primary)", fontSize: px * 0.36 }}
    >
      {initials(data.businessName) || "?"}
    </div>
  );
}
