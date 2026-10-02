import type { DigitalCardData } from "@/lib/cards/types";

export type TemplateProps = {
  data: DigitalCardData;
  qrSrc?: string;
};
