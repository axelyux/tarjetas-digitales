import type { ActionInput, CardInput } from "./schema";
import type { ActionType } from "./constants";

export function emptyAction(type: ActionType): ActionInput {
  return { type, label: "", value: "", icon: "link", message: "", enabled: true };
}

/** Filas iniciales de una tarjeta nueva. Las que queden vacías se descartan al guardar. */
export const STARTER_ACTION_TYPES: ActionType[] = ["whatsapp", "instagram", "facebook", "maps", "booking"];

export function emptyCardInput(id: string): CardInput {
  return {
    id,
    slug: "",
    businessName: "",
    customerName: "",
    description: "",
    category: "",
    address: "",
    schedule: "",
    extraInfo: "",
    hours: null,
    logoUrl: "",
    logoRatio: 1,
    coverImageUrl: "",
    coverMode: "color",
    coverColor2: "#64748b",
    coverFade: false,
    backgroundImageUrl: "",
    primaryColor: "#1e293b",
    secondaryColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    accentColor: "#2563eb",
    template: "modern",
    layoutVariant: "centered",
    actionsLayout: "stack",
    borderRadius: "md",
    buttonStyle: "solid",
    cardStyle: "flat",
    shadowStyle: "soft",
    logoSize: "md",
    logoShape: "circle",
    font: "inter",
    backgroundMode: "color",
    backgroundOverlay: 40,
    showQr: true,
    publicationStatus: "active",
    paymentStatus: "pending",
    actions: STARTER_ACTION_TYPES.map(emptyAction),
    branches: [],
  };
}
