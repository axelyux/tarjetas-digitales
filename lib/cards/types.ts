import type {
  ActionsLayout, BackgroundMode, BorderRadius, ButtonIcon, ButtonStyle, CardStyle, FontKey,
  LayoutVariant, LogoShape, LogoSize, ShadowStyle, Template,
} from "./constants";

export type CardButton = {
  id: string;
  label: string;
  url: string;
  icon: ButtonIcon;
  position: number;
  isActive: boolean;
};

/** Datos que consumen la tarjeta publica, el preview y todos los templates. */
export type DigitalCardData = {
  slug: string;
  businessName: string;
  description?: string;
  category?: string;
  address?: string;
  schedule?: string;
  extraInfo?: string;

  logoUrl?: string;
  coverImageUrl?: string;

  phone?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  bookingUrl?: string;

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  template: Template;
  layoutVariant: LayoutVariant;
  actionsLayout: ActionsLayout;
  borderRadius: BorderRadius;
  buttonStyle: ButtonStyle;
  cardStyle: CardStyle;
  shadowStyle: ShadowStyle;
  logoSize: LogoSize;
  logoShape: LogoShape;
  font: FontKey;
  backgroundMode: BackgroundMode;
  backgroundImageUrl?: string;
  backgroundOverlay: number;
  showQr: boolean;

  buttons: CardButton[];
};

/** Tarjeta completa para el panel de administracion. */
export type AdminCard = DigitalCardData & {
  id: string;
  isActive: boolean;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};
