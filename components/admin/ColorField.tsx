"use client";

import { useState } from "react";

type Props = { id: string; label: string; value: string; onChange: (hex: string) => void };

export function ColorField({ id, label, value, onChange }: Props) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // Si el valor cambia desde fuera (preset), refleja el nuevo valor en el campo de texto.
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
        />
        <input
          aria-label={`${label} (hexadecimal)`}
          value={text}
          maxLength={7}
          spellCheck={false}
          aria-invalid={!valid}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          className="field font-mono"
        />
      </div>
    </div>
  );
}
