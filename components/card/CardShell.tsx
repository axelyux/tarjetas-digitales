import type { CSSProperties, ReactNode } from "react";
import { RADIUS_VALUES, SHADOW_VALUES } from "@/lib/cards/constants";
import type { DigitalCardData } from "@/lib/cards/types";
import { readableOn } from "@/lib/color";
import { FONT_STACK } from "@/lib/fonts";

function safeCssUrl(url: string): string {
  return `url("${url.replace(/["\\\n\r]/g, encodeURIComponent)}")`;
}

type Props = {
  data: DigitalCardData;
  /** true cuando se renderiza dentro del preview del admin (no ocupa toda la pantalla). */
  embedded?: boolean;
  children: ReactNode;
};

/** Aplica el tema (variables CSS) y el fondo. Todos los colores de la tarjeta salen de aqui. */
export function CardShell({ data, embedded = false, children }: Props) {
  const style = {
    "--card-primary": data.primaryColor,
    "--card-secondary": data.secondaryColor,
    "--card-background": data.backgroundColor,
    "--card-text": data.textColor,
    "--card-accent": data.accentColor,
    "--card-on-primary": readableOn(data.primaryColor),
    "--card-on-accent": readableOn(data.accentColor),
    "--card-radius": RADIUS_VALUES[data.borderRadius],
    "--card-shadow": SHADOW_VALUES[data.shadowStyle],
    "--card-font": FONT_STACK[data.font],
    "--card-overlay": String(data.backgroundOverlay / 100),
  } as CSSProperties;

  const showImage = data.backgroundMode === "image" && data.backgroundImageUrl;

  return (
    <div className="cd-root" style={style} data-template={data.template}>
      {showImage ? <div className="cd-bg-image" style={{ backgroundImage: safeCssUrl(data.backgroundImageUrl!) }} /> : null}
      <div className={`mx-auto flex w-full max-w-[480px] flex-col ${embedded ? "min-h-full" : "min-h-dvh"}`}>
        {children}
      </div>
    </div>
  );
}
