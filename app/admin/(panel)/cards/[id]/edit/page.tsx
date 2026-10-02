import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
import { PaymentBadge, PublicationBadge } from "@/components/admin/StatusBadge";
import { CardForm } from "@/components/admin/CardForm";
import { CopyButton } from "@/components/admin/CopyButton";
import { getCardById } from "@/lib/cards/admin-queries";
import { adminCardToInput } from "@/lib/cards/mapper";
import { cardUrl } from "@/lib/site";

export const metadata = { title: "Editar tarjeta | Tarjetas Digitales" };

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) notFound();
  const isLive = card.publicationStatus === "active";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{card.businessName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PublicationBadge status={card.publicationStatus} />
            <PaymentBadge status={card.paymentStatus} />
            <span className="break-all text-sm text-muted">{cardUrl(card.slug)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#preview" className="btn lg:hidden">
            <Eye size={15} aria-hidden="true" /> Vista previa
          </a>
          <CopyButton value={cardUrl(card.slug)} />
          {isLive ? (
            <Link href={`/${card.slug}`} target="_blank" className="btn">
              <ExternalLink size={15} aria-hidden="true" /> Abrir tarjeta
            </Link>
          ) : (
            <Link href={`/p/${card.previewToken}`} target="_blank" className="btn">
              <Eye size={15} aria-hidden="true" /> Abrir vista previa
            </Link>
          )}
        </div>
      </div>
      <CardForm
        key={card.updatedAt}
        mode="edit"
        initial={adminCardToInput(card)}
        updatedAt={card.updatedAt}
        previewToken={card.previewToken}
      />
    </div>
  );
}
