"use client";

import { CircleCheck, CircleDollarSign, Copy, Download, ExternalLink, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCard, duplicateCard, setCardActive, setCardPaid, type ActionResult } from "@/lib/cards/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import { CopyButton } from "./CopyButton";

type Props = {
  card: { id: string; slug: string; businessName: string; isActive: boolean; isPaid: boolean };
  url: string;
};

type Pending = "deactivate" | "delete" | null;

export function CardRowActions({ card, url }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Pending>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);

  function run(action: () => Promise<ActionResult<unknown>>, success: string, after?: () => void) {
    menuRef.current?.removeAttribute("open");
    startTransition(async () => {
      const result = await action();
      setConfirm(null);
      if (result.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const menuItem = "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-paper disabled:opacity-50";

  return (
    <div className="flex items-center gap-1.5">
      <Link href={`/${card.slug}`} target="_blank" className="btn btn-sm btn-icon" aria-label={`Ver ${card.businessName}`} title="Ver">
        <ExternalLink size={15} aria-hidden="true" />
      </Link>
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
        <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-line bg-surface p-1 shadow-lg">
          <button
            type="button"
            className={menuItem}
            disabled={isPending}
            onClick={() => run(() => duplicateCard(card.id), "Tarjeta duplicada (inactiva)", undefined)}
          >
            <Copy size={15} aria-hidden="true" /> Duplicar
          </button>
          {card.isActive ? (
            <button type="button" className={menuItem} disabled={isPending} onClick={() => { menuRef.current?.removeAttribute("open"); setConfirm("deactivate"); }}>
              <Power size={15} aria-hidden="true" /> Desactivar
            </button>
          ) : (
            <button type="button" className={menuItem} disabled={isPending} onClick={() => run(() => setCardActive(card.id, true), "Tarjeta activada")}>
              <Power size={15} aria-hidden="true" /> Activar
            </button>
          )}
          <button
            type="button"
            className={menuItem}
            disabled={isPending}
            onClick={() => run(() => setCardPaid(card.id, !card.isPaid), card.isPaid ? "Marcada como pendiente" : "Marcada como pagada")}
          >
            {card.isPaid ? <CircleDollarSign size={15} aria-hidden="true" /> : <CircleCheck size={15} aria-hidden="true" />}
            {card.isPaid ? "Marcar pendiente" : "Marcar pagada"}
          </button>
          <button
            type="button"
            className={`${menuItem} text-danger`}
            disabled={isPending}
            onClick={() => { menuRef.current?.removeAttribute("open"); setConfirm("delete"); }}
          >
            <Trash2 size={15} aria-hidden="true" /> Eliminar
          </button>
        </div>
      </details>

      <ConfirmDialog
        open={confirm === "deactivate"}
        title="¿Desactivar tarjeta?"
        description={`/${card.slug} dejará de mostrarse al público y verá un aviso de tarjeta no disponible.`}
        confirmLabel="Desactivar"
        pending={isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(() => setCardActive(card.id, false), "Tarjeta desactivada")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="¿Eliminar tarjeta?"
        description={`Se eliminará "${card.businessName}" y sus imágenes de forma permanente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        pending={isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(() => deleteCard(card.id), "Tarjeta eliminada")}
      />
    </div>
  );
}
