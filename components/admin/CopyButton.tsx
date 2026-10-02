"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = { value: string; label?: string; iconOnly?: boolean; className?: string };

export function CopyButton({ value, label = "Copiar URL", iconOnly = false, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copia la URL:", value);
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={`btn ${iconOnly ? "btn-sm btn-icon" : ""} ${className}`}
    >
      <Icon size={15} aria-hidden="true" />
      {iconOnly ? null : copied ? "Copiada" : label}
    </button>
  );
}
