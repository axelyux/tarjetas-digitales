import type { DigitalCardData } from "@/lib/cards/types";
import { renderTemplate } from "@/components/templates";
import { CardShell } from "./CardShell";

type Props = {
  data: DigitalCardData;
  qrSrc?: string;
  embedded?: boolean;
};

/** Componente central: la página pública, el demo y el preview del admin usan exactamente este. */
export function DigitalCard({ data, qrSrc, embedded }: Props) {
  return (
    <CardShell data={data} embedded={embedded}>
      {renderTemplate({ data, qrSrc })}
    </CardShell>
  );
}
