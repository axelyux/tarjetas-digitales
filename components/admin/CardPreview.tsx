"use client";

import { useMemo } from "react";
import { DigitalCard } from "@/components/card/DigitalCard";
import { inputToCardData } from "@/lib/cards/mapper";
import type { CardInput } from "@/lib/cards/schema";
import { SLUG_REGEX } from "@/lib/cards/slug";

/** Marco de teléfono que reutiliza exactamente DigitalCard (sin duplicar diseño). */
export function CardPreview({ values }: { values: CardInput }) {
  const data = useMemo(() => inputToCardData(values), [values]);
  const qrSrc = values.showQr && SLUG_REGEX.test(values.slug) ? `/api/qr/${values.slug}` : undefined;

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.2rem] border border-line bg-ink p-2.5 shadow-lg">
        <div
          className="h-[640px] overflow-y-auto overflow-x-hidden rounded-[1.7rem] bg-white [container-type:inline-size]"
          onClickCapture={(e) => {
            // Los enlaces del preview no deben sacar al administrador del editor.
            if ((e.target as HTMLElement).closest("a")) e.preventDefault();
          }}
        >
          <DigitalCard data={data} qrSrc={qrSrc} embedded />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Vista previa en vivo</p>
    </div>
  );
}
