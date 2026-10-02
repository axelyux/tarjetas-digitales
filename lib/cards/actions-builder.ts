import type { ButtonIcon } from "./constants";
import { mapsLinkFromAddress, telLink, whatsappLink } from "./links";
import type { DigitalCardData } from "./types";

export type ActionIconKey =
  | "whatsapp" | "instagram" | "facebook" | "phone" | "map" | "booking" | "website" | ButtonIcon;

export type CardAction = {
  key: string;
  label: string;
  href: string;
  icon: ActionIconKey;
  external: boolean;
};

export type BuiltActions = {
  /** Acciones principales (la primera es el CTA destacado). */
  main: CardAction[];
  /** Redes sociales. */
  social: CardAction[];
};

export function buildActions(data: DigitalCardData): BuiltActions {
  const main: CardAction[] = [];
  const social: CardAction[] = [];

  if (data.whatsapp) {
    main.push({
      key: "whatsapp", label: "WhatsApp", icon: "whatsapp", external: true,
      href: whatsappLink(data.whatsapp, data.whatsappMessage),
    });
  }
  if (data.bookingUrl) {
    main.push({ key: "booking", label: "Agendar cita", icon: "booking", external: true, href: data.bookingUrl });
  }
  if (data.phone) {
    main.push({ key: "phone", label: "Llamar", icon: "phone", external: false, href: telLink(data.phone) });
  }
  const mapsHref = data.googleMapsUrl ?? (data.address ? mapsLinkFromAddress(data.address) : undefined);
  if (mapsHref) {
    main.push({ key: "maps", label: "Cómo llegar", icon: "map", external: true, href: mapsHref });
  }
  if (data.websiteUrl) {
    main.push({ key: "website", label: "Sitio web", icon: "website", external: true, href: data.websiteUrl });
  }
  for (const button of data.buttons) {
    main.push({ key: `custom-${button.id}`, label: button.label, icon: button.icon, external: true, href: button.url });
  }

  if (data.instagramUrl) {
    social.push({ key: "instagram", label: "Instagram", icon: "instagram", external: true, href: data.instagramUrl });
  }
  if (data.facebookUrl) {
    social.push({ key: "facebook", label: "Facebook", icon: "facebook", external: true, href: data.facebookUrl });
  }

  return { main, social };
}
