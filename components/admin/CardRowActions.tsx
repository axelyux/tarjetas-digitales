"use client";

import {
  Archive, ArchiveRestore, CircleCheck, CircleDollarSign, Copy, Download, ExternalLink, MoreHorizontal, Pencil,
  Power, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteCard, duplicateCard, setPaymentStatus, setPublicationStatus, type ActionResult,
} from "@/lib/cards/actions";
import type { PaymentStatus, PublicationStatus } from "@/lib/cards/constants";
import { ConfirmDialog } from "./ConfirmDialog";
import { CopyButton } from "./CopyButton";

type Props = {
  card: { id: string; slug: string; businessName: string; publicationStatus: PublicationStatus; paymentStatus: PaymentStatus };
  url: string;
};

type Pending = "deactivate" | "archive" | "delete" | null;

export function CardRowActions({ card, url }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Pending>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const busy = useRef(false);
  const archived = card.publicationStatus === "archived";

  function run(action: () => Promise<ActionResult<unknown>>, success: string) {
    if (busy.current) return; // protege contra doble clic
    busy.current = true;
    menuRef.current?.removeAttribute("open");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          toast.success(success);
          setConfirm(null);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("No se pudo completar. Revisa tu conexión e intenta de nuevo.");
      } finally {
        busy.current = false;
      }
    });
  }

  const closeMenu = () => menuRef.current?.removeAttribute("open");
  const item = "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-paper disabled:opacity-50";

  return (
    <div className="flex items-center gap-1.5">
      {!archived ? (
        <Link href={`/${card.slug}`} target="_blank" className="btn btn-sm btn-icon" aria-label={`Ver ${card.businessName}`} title="Ver">
          <ExternalLink size={15} aria-hidden="true" />
        </Link>
      ) : null}
      <Link href={`/admin/cards/${card.id}/edit`} className="btn btn-sm btn-icon" aria-label={`Editar ${card.businessName}`} title="Editar">
        <Pencil size={15} aria-hidden="true" />
      </Link>
      <CopyButton value={url} iconOnly />
      <a
        href={`/api/qr/${card.slug}?format=png&download=1`}
        className="btn btn-sm btn-icon"
        aria-label={`Descargar QR de ${card.businessName}`}
        title="Descargar QR"
      >
        <Download size={15} aria-hidden="true" />
      </a>

      <details ref={menuRef} className="relative">
        <summary
          className="btn btn-sm btn-icon list-none [&::-webkit-details-marker]:hidden"
          aria-label={`Más acciones para ${card.businessName}`}
          title="Más acciones"
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </summary>
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-line bg-surface p-1 shadow-lg">
          <button type="button" className={item} disabled={isPending} onClick={() => run(() => duplicateCard(card.id), "Tarjeta duplicada como borrador")}>
            <Copy size={15} aria-hidden="true" /> Duplicar
          </button>
          {!archived && card.publicationStatus !== "active" ? (
            <button type="button" className={item} disabled={isPending} onClick={() => run(() => setPublicationStatus(card.id, "active"), "Tarjeta activada")}>
              <Power size={15} aria-hidden="true" /> Activar
            </button>
          ) : null}
          {card.publicationStatus === "active" ? (
            <button type="button" className={item} disabled={isPending} onClick={() => { closeMenu(); setConfirm("deactivate"); }}>
              <Power size={15} aria-hidden="true" /> Desactivar
            </button>
          ) : null}
          {card.paymentStatus === "paid" ? (
            <button type="button" className={item} disabled={isPending} onClick={() => run(() => setPaymentStatus(card.id, "pending"), "Pago marcado como pendiente")}>
              <CircleDollarSign size={15} aria-hidden="true" /> Marcar pendiente
            </button>
          ) : (
            <button type="button" className={item} disabled={isPending} onClick={() => run(() => setPaymentStatus(card.id, "paid"), "Pago marcado como pagado")}>
              <CircleCheck size={15} aria-hidden="true" /> Marcar pagada
            </button>
          )}
          {archived ? (
            <>
              <button type="button" className={item} disabled={isPending} onClick={() => run(() => setPublicationStatus(card.id, "inactive"), "Tarjeta restaurada (inactiva)")}>
                <ArchiveRestore size={15} aria-hidden="true" /> Restaurar
              </button>
              <button type="button" className={`${item} text-danger`} disabled={isPending} onClick={() => { closeMenu(); setConfirm("delete"); }}>
                <Trash2 size={15} aria-hidden="true" /> Eliminar definitivamente
              </button>
            </>
          ) : (
            <button type="button" className={item} disabled={isPending} onClick={() => { closeMenu(); setConfirm("archive"); }}>
              <Archive size={15} aria-hidden="true" /> Archivar
            </button>
          )}
        </div>
      </details>

      <ConfirmDialog
        open={confirm === "deactivate"}
        title="¿Desactivar tarjeta?"
        description={`/${card.slug} dejará de mostrarse y verá el aviso “tarjeta no disponible”. Puedes reactivarla cuando quieras.`}
        confirmLabel="Desactivar"
        pending={isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(() => setPublicationStatus(card.id, "inactive"), "Tarjeta desactivada")}
      />
      <ConfirmDialog
        open={confirm === "archive"}
        title="¿Archivar tarjeta?"
        description={`“${card.businessName}” dejará de ser pública y saldrá de la lista principal. Sus QR impresos mostrarán “no disponible”. Podrás restaurarla.`}
        confirmLabel="Archivar"
        pending={isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(() => setPublicationStatus(card.id, "archived"), "Tarjeta archivada")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="¿Eliminar definitivamente?"
        description={`Se eliminará “${card.businessName}”, su configuración e imágenes. Los QR impresos dejarán de funcionar. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        pending={isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(() => deleteCard(card.id), "Tarjeta eliminada")}
      />
    </div>
  );
}
