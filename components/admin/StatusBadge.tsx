import { PAYMENT_LABELS, PUBLICATION_LABELS, type PaymentStatus, type PublicationStatus } from "@/lib/cards/constants";

const STYLES = {
  green: "bg-[#e3f3ec] text-[#116149]",
  gray: "bg-[#ececea] text-[#5b5f66]",
  amber: "bg-[#fbeed5] text-[#8a5200]",
  blue: "bg-[#e3ecfb] text-[#1d4d9b]",
  violet: "bg-[#ece8fa] text-[#4b3a9a]",
  red: "bg-[#fbe4e1] text-[#9b2217]",
} as const;

function Badge({ tone, children }: { tone: keyof typeof STYLES; children: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[tone]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

const PUBLICATION_TONE: Record<PublicationStatus, keyof typeof STYLES> = {
  draft: "gray", preview: "violet", active: "green", inactive: "gray", archived: "gray",
};
const PAYMENT_TONE: Record<PaymentStatus, keyof typeof STYLES> = { pending: "amber", paid: "blue", cancelled: "red" };

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  return <Badge tone={PUBLICATION_TONE[status]}>{PUBLICATION_LABELS[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_LABELS[status]}</Badge>;
}
