"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ACTION_CONFIG } from "@/lib/cards/action-types";
import { ACTION_TYPES, BUTTON_ICONS, MAX_ACTIONS, type ActionType } from "@/lib/cards/constants";
import { emptyAction } from "@/lib/cards/defaults";
import type { CardInput } from "@/lib/cards/schema";
import { fieldError } from "./form-ui";
import { ImageUploader } from "./ImageUploader";

const ICON_LABELS: Record<string, string> = {
  link: "Enlace", menu: "Menú", tag: "Promoción", calendar: "Calendario", "shopping-bag": "Compras", star: "Estrella",
  gift: "Regalo", clock: "Reloj", "map-pin": "Ubicación", phone: "Teléfono", mail: "Correo", globe: "Web",
  camera: "Cámara", heart: "Corazón", "book-open": "Catálogo", truck: "Entrega", "file-text": "Documento", video: "Video",
};

const QUICK: ActionType[] = ["whatsapp", "phone", "custom_url", "pdf"];

export function ActionsEditor({ cardId }: { cardId: string }) {
  const { control, register, setValue, formState: { errors } } = useFormContext<CardInput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "actions" });
  const values = useWatch({ control, name: "actions" });

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">
          Sin botones. Agrega WhatsApp, Maps, un enlace o un PDF.
        </p>
      ) : null}

      {fields.map((field, i) => {
        const current = values?.[i];
        const type = current?.type ?? field.type;
        const config = ACTION_CONFIG[type];
        const err = (name: string) => fieldError(errors, `actions.${i}.${name}`);
        const incomplete = !!current && current.enabled && !current.value.trim();
        return (
          <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={`Tipo del botón ${i + 1}`}
                className="field !w-auto"
                {...register(`actions.${i}.type`, {
                  onChange: (e) => {
                    const next = e.target.value as ActionType;
                    if (!ACTION_CONFIG[next].customIcon) setValue(`actions.${i}.icon`, "link");
                  },
                })}
              >
                {ACTION_TYPES.map((t) => <option key={t} value={t}>{ACTION_CONFIG[t].label}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" {...register(`actions.${i}.enabled`)} /> Visible
              </label>
              <div className="ml-auto flex gap-1">
                <button type="button" className="btn btn-sm btn-icon" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir botón ${i + 1}`}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-sm btn-icon" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label={`Bajar botón ${i + 1}`}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-sm btn-icon" onClick={() => remove(i)} aria-label={`Eliminar botón ${i + 1}`}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <input
                  aria-label={`Texto del botón ${i + 1}`}
                  placeholder={config.labelRequired ? "Texto del botón (obligatorio)" : `Texto (por defecto: ${config.label})`}
                  className="field"
                  aria-invalid={err("label") ? true : undefined}
                  {...register(`actions.${i}.label`)}
                />
                {err("label") ? <p role="alert" className="mt-1 text-xs text-danger">{err("label")}</p> : null}
              </div>
              <div>
                <input
                  aria-label={`Destino del botón ${i + 1}`}
                  placeholder={config.placeholder}
                  className="field"
                  inputMode={type === "whatsapp" || type === "phone" ? "tel" : type === "email" ? "email" : "url"}
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={err("value") ? true : undefined}
                  {...register(`actions.${i}.value`)}
                />
                {err("value") ? (
                  <p role="alert" className="mt-1 text-xs text-danger">{err("value")}</p>
                ) : incomplete ? (
                  <p className="mt-1 text-xs text-warn">Sin destino: este botón no se mostrará ni se guardará.</p>
                ) : config.hint ? (
                  <p className="mt-1 text-xs text-muted">{config.hint}</p>
                ) : null}
              </div>
              {type === "whatsapp" ? (
                <input
                  aria-label={`Mensaje inicial del botón ${i + 1}`}
                  placeholder="Mensaje inicial (opcional): Hola, quiero agendar una cita"
                  className="field sm:col-span-2"
                  {...register(`actions.${i}.message`)}
                />
              ) : null}
              {config.customIcon ? (
                <select aria-label={`Icono del botón ${i + 1}`} className="field" {...register(`actions.${i}.icon`)}>
                  {BUTTON_ICONS.map((icon) => <option key={icon} value={icon}>Icono: {ICON_LABELS[icon] ?? icon}</option>)}
                </select>
              ) : null}
              {type === "pdf" ? (
                <ImageUploader
                  compact
                  cardId={cardId}
                  kind="pdf"
                  label="Subir PDF"
                  value={current?.value ?? ""}
                  onChange={(url) => setValue(`actions.${i}.value`, url, { shouldDirty: true, shouldValidate: true })}
                />
              ) : null}
            </div>
          </div>
        );
      })}

      {fields.length < MAX_ACTIONS ? (
        <div className="flex flex-wrap items-center gap-2">
          {QUICK.map((t) => (
            <button key={t} type="button" className="btn btn-sm" onClick={() => append(emptyAction(t))}>
              <Plus size={14} aria-hidden="true" /> {ACTION_CONFIG[t].label}
            </button>
          ))}
          <select
            aria-label="Agregar otro tipo de botón"
            className="field !w-auto"
            value=""
            onChange={(e) => {
              if (e.target.value) append(emptyAction(e.target.value as ActionType));
            }}
          >
            <option value="">Otro tipo...</option>
            {ACTION_TYPES.filter((t) => !QUICK.includes(t)).map((t) => <option key={t} value={t}>{ACTION_CONFIG[t].label}</option>)}
          </select>
        </div>
      ) : null}
    </div>
  );
}
