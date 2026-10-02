import type { DigitalCardData } from "@/lib/cards/types";
import { CardLogo } from "./CardLogo";

type Props = {
  data: DigitalCardData;
  /** Clases extra que cada template aplica al nombre / categoria / descripcion. */
  nameClassName?: string;
  categoryClassName?: string;
  descriptionClassName?: string;
};

/** Cabecera compartida. Respeta layoutVariant: centered | left | hero | compact. */
export function CardHeader({ data, nameClassName = "", categoryClassName = "", descriptionClassName = "" }: Props) {
  const variant = data.layoutVariant;

  const name = (
    <h1 className={`cd-rise max-w-full text-balance font-bold leading-tight [overflow-wrap:anywhere] ${variant === "compact" ? "text-xl" : "text-2xl"} ${nameClassName}`} style={{ "--i": 1 } as React.CSSProperties}>
      {data.businessName}
    </h1>
  );
  const category = data.category ? (
    <p className={`cd-rise cd-muted max-w-full text-xs font-medium uppercase tracking-[0.14em] [overflow-wrap:anywhere] ${categoryClassName}`} style={{ "--i": 2 } as React.CSSProperties}>
      {data.category}
    </p>
  ) : null;
  const description = data.description ? (
    <p className={`cd-rise cd-muted max-w-[34ch] whitespace-pre-line text-pretty text-[0.95rem] [overflow-wrap:anywhere] ${descriptionClassName}`} style={{ "--i": 3 } as React.CSSProperties}>
      {data.description}
    </p>
  ) : null;

  if (variant === "compact") {
    return (
      <header className="flex flex-col gap-3 px-5 pt-6">
        <div className="cd-rise flex items-center gap-4">
          <CardLogo data={data} scale={0.75} />
          <div className="flex min-w-0 flex-col gap-1">
            {name}
            {category}
          </div>
        </div>
        {description}
      </header>
    );
  }

  if (variant === "hero") {
    return (
      <header className="flex flex-col items-center text-center">
        <div
          className={`relative w-full overflow-hidden ${data.coverFade ? "h-48" : "h-40"}`}
          style={{
            background:
              data.coverMode === "gradient"
                ? "linear-gradient(135deg, var(--card-primary), var(--card-cover-2))"
                : "var(--card-primary)",
          }}
        >
          {data.coverMode === "image" && data.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagen servida por el CDN de Supabase
            <img src={data.coverImageUrl} alt="" width={960} height={320} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          ) : null}
          {data.coverFade ? (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28"
              style={{ background: "linear-gradient(to bottom, transparent, var(--card-background))" }}
            />
          ) : null}
        </div>
        <div className="-mt-12 flex flex-col items-center gap-2 px-5">
          <CardLogo data={data} className="cd-rise" />
          {name}
          {category}
          {description}
        </div>
      </header>
    );
  }

  const left = variant === "left";
  return (
    <header className={`flex flex-col gap-2 px-5 pt-9 ${left ? "items-start text-left" : "items-center text-center"}`}>
      <CardLogo data={data} className="cd-rise mb-1" />
      {name}
      {category}
      {description}
    </header>
  );
}
