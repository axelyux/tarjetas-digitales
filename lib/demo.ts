import { LAYOUT_VARIANTS, TEMPLATES, type LayoutVariant, type Template } from "./cards/constants";
import { PRESETS, type PresetKey } from "./cards/presets";
import type { DigitalCardData } from "./cards/types";

const PRESET_FOR_TEMPLATE: Record<Template, PresetKey> = {
  modern: "classic",
  bold: "midnight",
  elegant: "luxury",
  soft: "fresh",
  minimal: "minimal",
  editorial: "warm",
};

/** Tarjeta de ejemplo sin base de datos: sirve para ver cada template en /demo. */
export function buildDemoCard(template: Template, layoutVariant: LayoutVariant = "centered"): DigitalCardData {
  const preset = PRESETS[PRESET_FOR_TEMPLATE[template]].values;
  return {
    slug: "demo",
    businessName: "Barbería Carlos",
    description: "Cortes clásicos, fade y barba con navaja. Con cita o sin ella.",
    category: "Barbería",
    address: "Av. Juárez 120, Centro, Ciudad de México",
    schedule: "Lun a Sáb 10:00 - 20:00",
    extraInfo: "Estacionamiento gratuito para clientes.",
    phone: "5512345678",
    whatsapp: "5512345678",
    whatsappMessage: "Hola, quiero agendar una cita",
    instagramUrl: "https://instagram.com/barberiacarlos",
    facebookUrl: "https://facebook.com/barberiacarlos",
    googleMapsUrl: "https://maps.google.com/?q=Av+Juarez+120",
    bookingUrl: "https://example.com/agenda",
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
    buttons: [{ id: "demo-1", label: "Promociones", url: "https://example.com/promos", icon: "tag", position: 0, isActive: true }],
  };
}

export function parseDemoParams(params: { template?: string; layout?: string }) {
  const template = TEMPLATES.find((t) => t === params.template) ?? "modern";
  const layout = LAYOUT_VARIANTS.find((l) => l === params.layout) ?? "centered";
  return { template, layout };
}
