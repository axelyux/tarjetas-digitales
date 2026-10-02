import { LAYOUT_VARIANTS, TEMPLATES, type LayoutVariant, type Template } from "./cards/constants";
import { defaultHours } from "./cards/hours";
import { PRESETS, type PresetKey } from "./cards/presets";
import type { CardAction, DigitalCardData } from "./cards/types";

const PRESET_FOR_TEMPLATE: Record<Template, PresetKey> = {
  modern: "classic",
  bold: "midnight",
  elegant: "luxury",
  soft: "fresh",
  minimal: "minimal",
  editorial: "warm",
};

export function demoAction(over: Partial<CardAction> & Pick<CardAction, "type" | "value">, index: number): CardAction {
  return { id: `demo-${index}`, label: "", icon: "link", metadata: {}, enabled: true, sortOrder: index, ...over };
}

/** Tarjeta de ejemplo sin base de datos: sirve para ver cada template en /demo. */
export function buildDemoCard(template: Template, layoutVariant: LayoutVariant = "centered"): DigitalCardData {
  const preset = PRESETS[PRESET_FOR_TEMPLATE[template]].values;
  const hours = defaultHours();
  hours.sat = { closed: false, open: "10:00", close: "14:00" };
  hours.mon = hours.tue = hours.wed = hours.thu = hours.fri = { closed: false, open: "10:00", close: "20:00" };
  return {
    slug: "demo",
    businessName: "Barbería Carlos",
    description: "Cortes clásicos, fade y barba con navaja. Con cita o sin ella.",
    category: "Barbería",
    address: "Av. Juárez 120, Centro, Ciudad de México",
    schedule: undefined,
    extraInfo: "Estacionamiento gratuito para clientes.",
    hours,
    logoRatio: 1,
    coverMode: "gradient",
    coverFade: true,
    ...preset,
    template,
    layoutVariant,
    actionsLayout: template === "soft" || template === "modern" ? "grid" : "stack",
    cardStyle: "flat",
    logoSize: "md",
    logoShape: template === "bold" || template === "elegant" ? "square" : "circle",
    backgroundMode: "color",
    backgroundOverlay: 40,
    showQr: true,
    actions: [
      demoAction({ type: "whatsapp", value: "5512345678", label: "WhatsApp citas", metadata: { message: "Hola, quiero agendar una cita" } }, 0),
      demoAction({ type: "whatsapp", value: "5598765432", label: "WhatsApp ventas" }, 1),
      demoAction({ type: "booking", value: "https://example.com/agenda" }, 2),
      demoAction({ type: "maps", value: "Av. Juárez 120, Centro, Ciudad de México" }, 3),
      demoAction({ type: "custom_url", label: "Promociones", value: "https://example.com/promos", icon: "tag" }, 4),
      demoAction({ type: "pdf", value: "https://example.com/catalogo.pdf" }, 5),
      demoAction({ type: "instagram", value: "@barberiacarlos" }, 6),
      demoAction({ type: "facebook", value: "barberiacarlos" }, 7),
    ],
    branches: [
      { id: "b1", name: "Sucursal Centro", address: "Av. Juárez 120", phone: "5512345678", hours: null, enabled: true, sortOrder: 0 },
      { id: "b2", name: "Sucursal Madero", address: "Calle Madero 45", mapsUrl: "https://maps.google.com/?q=Madero+45", whatsapp: "5511112222", hours, enabled: true, sortOrder: 1 },
    ],
  };
}

export function parseDemoParams(params: { template?: string; layout?: string }) {
  const template = TEMPLATES.find((t) => t === params.template) ?? "modern";
  const layout = LAYOUT_VARIANTS.find((l) => l === params.layout) ?? "centered";
  return { template, layout };
}
