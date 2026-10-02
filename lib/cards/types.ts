import type {
  ActionType, ActionsLayout, BackgroundMode, BorderRadius, ButtonIcon, ButtonStyle, CardStyle, FontKey,
  CoverMode, LayoutVariant, LogoShape, LogoSize, PaymentStatus, PublicationStatus, ShadowStyle, Template,
} from "./constants";
import type { Hours } from "./hours";

export type ActionMetadata = { message?: string };

/** Acción configurable de la tarjeta (WhatsApp, enlace, PDF...). Cualquier cantidad, cualquier orden. */
export type CardAction = {
  id: string;
  type: ActionType;
  label: string;
  value: string;
  icon: ButtonIcon;
  metadata: ActionMetadata;
  enabled: boolean;
  sortOrder: number;
};

export type CardBranch = {
  id: string;
  name: string;
  address?: string;
  mapsUrl?: string;
  phone?: string;
  whatsapp?: string;
  hours: Hours | null;
  enabled: boolean;
  sortOrder: number;
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
  hours: Hours | null;

  logoUrl?: string;
  logoRatio: number;
  coverImageUrl?: string;
  coverMode: CoverMode;
  coverColor2: string;
  coverFade: boolean;

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

  actions: CardAction[];
  branches: CardBranch[];
};

/** Tarjeta completa para el panel de administracion. */
export type AdminCard = DigitalCardData & {
  id: string;
  customerName?: string;
  publicationStatus: PublicationStatus;
  paymentStatus: PaymentStatus;
  previewToken: string;
  createdAt: string;
  /** Texto original de Postgres (microsegundos): se usa para el control de concurrencia. */
  updatedAt: string;
  publishedAt?: string;
};

/** Fila ligera para el listado del panel. */
export type AdminListItem = {
  id: string;
  slug: string;
  businessName: string;
  category?: string;
  customerName?: string;
  template: Template;
  publicationStatus: PublicationStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};
