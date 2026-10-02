"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { MAX_BRANCHES } from "@/lib/cards/constants";
import type { CardInput } from "@/lib/cards/schema";
import { fieldError } from "./form-ui";
import { HoursEditor } from "./HoursEditor";

export function BranchesEditor() {
  const { control, register, setValue, formState: { errors } } = useFormContext<CardInput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "branches" });
  const values = useWatch({ control, name: "branches" });

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      {fields.map((field, i) => {
        const err = (name: string) => fieldError(errors, `branches.${i}.${name}`);
        return (
          <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <input
                  aria-label={`Nombre de la sucursal ${i + 1}`}
                  placeholder="Sucursal Centro"
                  className="field"
                  aria-invalid={err("name") ? true : undefined}
                  {...register(`branches.${i}.name`)}
                />
                {err("name") ? <p role="alert" className="mt-1 text-xs text-danger">{err("name")}</p> : null}
              </div>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" {...register(`branches.${i}.enabled`)} /> Visible
              </label>
              <div className="flex gap-1">
                <button type="button" className="btn btn-sm btn-icon" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir sucursal ${i + 1}`}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-sm btn-icon" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label={`Bajar sucursal ${i + 1}`}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-sm btn-icon" onClick={() => remove(i)} aria-label={`Eliminar sucursal ${i + 1}`}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input aria-label={`Dirección de la sucursal ${i + 1}`} placeholder="Dirección" className="field" {...register(`branches.${i}.address`)} />
              <div>
                <input aria-label={`Enlace de Maps de la sucursal ${i + 1}`} placeholder="Enlace de Google Maps (opcional)" className="field" aria-invalid={err("mapsUrl") ? true : undefined} {...register(`branches.${i}.mapsUrl`)} />
                {err("mapsUrl") ? <p role="alert" className="mt-1 text-xs text-danger">{err("mapsUrl")}</p> : null}
              </div>
              <div>
                <input aria-label={`Teléfono de la sucursal ${i + 1}`} placeholder="Teléfono" inputMode="tel" className="field" aria-invalid={err("phone") ? true : undefined} {...register(`branches.${i}.phone`)} />
                {err("phone") ? <p role="alert" className="mt-1 text-xs text-danger">{err("phone")}</p> : null}
              </div>
              <div>
                <input aria-label={`WhatsApp de la sucursal ${i + 1}`} placeholder="WhatsApp" inputMode="tel" className="field" aria-invalid={err("whatsapp") ? true : undefined} {...register(`branches.${i}.whatsapp`)} />
                {err("whatsapp") ? <p role="alert" className="mt-1 text-xs text-danger">{err("whatsapp")}</p> : null}
              </div>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Horario de esta sucursal</summary>
              <div className="mt-2">
                <HoursEditor
                  idPrefix={`branch-${i}`}
                  value={values?.[i]?.hours ?? null}
                  onChange={(h) => setValue(`branches.${i}.hours`, h, { shouldDirty: true, shouldValidate: true })}
                />
              </div>
            </details>
          </div>
        );
      })}
      {fields.length < MAX_BRANCHES ? (
        <button
          type="button"
          className="btn btn-sm self-start"
          onClick={() => append({ name: "", address: "", mapsUrl: "", phone: "", whatsapp: "", hours: null, enabled: true })}
        >
          <Plus size={14} aria-hidden="true" /> Agregar sucursal
        </button>
      ) : null}
    </div>
  );
}
