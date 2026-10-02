import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
import { ActiveBadge, PaidBadge } from "@/components/admin/StatusBadge";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{card.businessName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ActiveBadge active={card.isActive} />
            <PaidBadge paid={card.isPaid} />
            <span className="text-sm text-muted">{cardUrl(card.slug)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#preview" className="btn lg:hidden">
            <Eye size={15} aria-hidden="true" /> Vista previa
          </a>
          <CopyButton value={cardUrl(card.slug)} />
          <Link href={`/${card.slug}`} target="_blank" className="btn">
            <ExternalLink size={15} aria-hidden="true" /> Abrir tarjeta
          </Link>
        </div>
      </div>
      <CardForm key={card.updatedAt} mode="edit" initial={adminCardToInput(card)} />
    </div>
  );
}
