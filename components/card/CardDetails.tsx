import type { DigitalCardData } from "@/lib/cards/types";
import { CardBranches, hasBranches } from "./CardBranches";
import { CardInfo, hasInfo } from "./CardInfo";

export function hasDetails(data: DigitalCardData): boolean {
  return hasInfo(data) || hasBranches(data);
}

/** Información del negocio + sucursales. No renderiza nada si no hay datos (sin secciones vacías). */
export function CardDetails({ data, variant = "list", className = "" }: { data: DigitalCardData; variant?: "list" | "plain"; className?: string }) {
  if (!hasDetails(data)) return null;
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <CardInfo data={data} variant={variant} />
      <CardBranches data={data} />
    </div>
  );
}
