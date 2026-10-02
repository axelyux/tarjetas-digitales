import { LOGO_PX } from "@/lib/cards/constants";
import type { DigitalCardData } from "@/lib/cards/types";

const SHAPE_CLASS = { circle: "rounded-full", rounded: "rounded-[22%]", square: "rounded-none" } as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  data: DigitalCardData;
  /** Escala sobre el tamano configurado (p. ej. layout compacto). */
  scale?: number;
  className?: string;
};

/** Logo cuadrado: recorte según la forma elegida. Logo horizontal/vertical: se muestra completo, sin deformar. */
export function CardLogo({ data, scale = 1, className = "" }: Props) {
  const px = Math.round(LOGO_PX[data.logoSize] * scale);

  if (data.logoUrl) {
    const ratio = data.logoRatio;
    const free = ratio > 1.15 || ratio < 0.87;
    if (free) {
      const height = Math.round(px * (ratio < 1 ? 1.15 : 0.9));
      const width = Math.max(24, Math.min(Math.round(height * ratio), 260));
      return (
        // eslint-disable-next-line @next/next/no-img-element -- logo servido por el CDN de Supabase
        <img
          src={data.logoUrl}
          alt={`Logo de ${data.businessName}`}
          width={width}
          height={height}
          decoding="async"
          className={`max-w-full shrink-0 object-contain ${data.layoutVariant === "hero" ? "rounded-xl bg-[var(--card-background)] p-2" : ""} ${className}`}
          style={{ width, height: data.layoutVariant === "hero" ? height + 16 : height }}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo servido por el CDN de Supabase
      <img
        src={data.logoUrl}
        alt={`Logo de ${data.businessName}`}
        width={px}
        height={px}
        decoding="async"
        className={`shrink-0 bg-[var(--card-background)] object-cover ring-4 ring-[var(--card-background)] ${SHAPE_CLASS[data.logoShape]} ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold ring-4 ring-[var(--card-background)] ${SHAPE_CLASS[data.logoShape]} ${className}`}
      style={{ width: px, height: px, background: "var(--card-primary)", color: "var(--card-on-primary)", fontSize: px * 0.36 }}
    >
      {initials(data.businessName) || "?"}
    </div>
  );
}
