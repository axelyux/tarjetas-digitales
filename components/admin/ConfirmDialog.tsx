"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, danger = false, pending = false, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-black/40"
    >
      <h2 id="confirm-title" className="text-base font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
        <button type="button" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
