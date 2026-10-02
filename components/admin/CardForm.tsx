"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Download, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { createCard, updateCard } from "@/lib/cards/actions";
import {
  ACTIONS_LAYOUTS, BORDER_RADII, BUTTON_ICONS, BUTTON_STYLES, FONTS, FONT_LABELS, LAYOUT_LABELS,
  LAYOUT_VARIANTS, LOGO_SHAPES, LOGO_SIZES, MAX_CUSTOM_BUTTONS, SHADOW_STYLES, TEMPLATES, TEMPLATE_LABELS,
} from "@/lib/cards/constants";
import { PRESETS, PRESET_KEYS, type PresetKey } from "@/lib/cards/presets";
import { cardInputSchema, type CardInput } from "@/lib/cards/schema";
import { slugify } from "@/lib/cards/slug";
import { cardUrl } from "@/lib/site";
import { CardPreview } from "./CardPreview";
import { ColorField } from "./ColorField";
import { CopyButton } from "./CopyButton";
import { Field, Section, Segmented, Toggle } from "./form-ui";
import { ImageUploader } from "./ImageUploader";

const CATEGORIES = [
  "Barbería", "Salón de belleza", "Uñas", "Restaurante", "Cafetería", "Taller mecánico",
  "Dentista", "Gimnasio", "Tienda", "Profesional independiente",
];

const TEMPLATE_HINTS: Record<(typeof TEMPLATES)[number], string> = {
  minimal: "Sobrio, filas con líneas",
  modern: "Bloques y panel de info",
  elegant: "Marco fino, serif",
  bold: "Pesado, sombra dura",
  soft: "Tarjeta flotante suave",
  editorial: "Titular grande, índice",
};

const opts = <T extends string>(values: readonly T[], labels?: Partial<Record<T, string>>) =>
  values.map((v) => ({ value: v, label: labels?.[v] ?? v }));

const RADIUS_LABELS = { none: "Recto", sm: "Sutil", md: "Medio", lg: "Amplio", full: "Píldora" } as const;
const BUTTON_STYLE_LABELS = { solid: "Sólido", outline: "Contorno", soft: "Suave" } as const;
const SHADOW_LABELS = { none: "Ninguna", soft: "Suave", strong: "Marcada" } as const;
const SIZE_LABELS = { sm: "Pequeño", md: "Medio", lg: "Grande" } as const;
const SHAPE_LABELS = { circle: "Círculo", rounded: "Redondeado", square: "Cuadrado" } as const;
const ACTIONS_LABELS = { stack: "Vertical", grid: "Cuadrícula" } as const;
const ICON_LABELS: Record<string, string> = {
  link: "Enlace", menu: "Menú", tag: "Promoción", calendar: "Calendario", "shopping-bag": "Compras", star: "Estrella",
  gift: "Regalo", clock: "Reloj", "map-pin": "Ubicación", phone: "Teléfono", mail: "Correo", globe: "Web",
  camera: "Cámara", heart: "Corazón", "book-open": "Catálogo", truck: "Entrega",
};

type Props = { initial: CardInput; mode: "create" | "edit" };

export function CardForm({ initial, mode }: Props) {
  const router = useRouter();
  const {
    register, handleSubmit, setValue, setError, control, formState: { errors, isDirty },
  } = useForm<CardInput>({ resolver: zodResolver(cardInputSchema), defaultValues: initial, mode: "onTouched" });
  const { fields, append, remove } = useFieldArray({ control, name: "buttons" });

  const values = useWatch({ control }) as CardInput;
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const slugTouched = useRef(mode === "edit");
  const [suggested, setSuggested] = useState<string | null>(null);

  // Slug automático desde el nombre mientras no se edite manualmente.
  useEffect(() => {
    if (!slugTouched.current) setValue("slug", slugify(values.businessName), { shouldValidate: values.slug !== "" });
  }, [values.businessName, values.slug, setValue]);

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    if (!isDirty || created) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, created]);

  const err = (name: FieldPath<CardInput>) => {
    const parts = name.split(".");
    let node: unknown = errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    return (node as { message?: string } | undefined)?.message;
  };
  const input = (name: FieldPath<CardInput>) => ({
    ...register(name),
    id: name,
    className: "field",
    "aria-invalid": err(name) ? (true as const) : undefined,
    "aria-describedby": err(name) ? `${name}-error` : undefined,
  });
  const set = <K extends FieldPath<CardInput>>(name: K, value: unknown) =>
    setValue(name, value as never, { shouldDirty: true, shouldValidate: true });

  function applyPreset(key: PresetKey) {
    for (const [k, v] of Object.entries(PRESETS[key].values)) set(k as FieldPath<CardInput>, v);
  }

  async function onSubmit(data: CardInput) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSuggested(null);
    try {
      const result = mode === "create" ? await createCard(data) : await updateCard(data);
      if (!result.ok) {
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(key as FieldPath<CardInput>, { message });
        }
        if (result.suggestedSlug) setSuggested(result.suggestedSlug);
        toast.error(result.error);
        return;
      }
      if (mode === "create") {
        setCreated(result.data);
        window.scrollTo({ top: 0 });
      } else {
        toast.success("Cambios guardados");
        router.refresh();
      }
    } catch {
      toast.error("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (created) {
    const url = cardUrl(created.slug);
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#e3f3ec] text-[#116149]">
          <Check size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Tarjeta creada</h1>
        <p className="mt-1 text-sm text-muted">Ya está disponible en esta dirección:</p>
        <p className="mt-3 break-all rounded-lg bg-paper px-3 py-2.5 font-mono text-sm">{url}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton value={url} label="Copiar" />
          <Link href={`/${created.slug}`} target="_blank" className="btn">
            <ExternalLink size={15} aria-hidden="true" /> Ver
          </Link>
          <Link href={`/admin/cards/${created.id}/edit`} className="btn">
            <Pencil size={15} aria-hidden="true" /> Editar
          </Link>
          <a href={`/api/qr/${created.slug}?format=png&download=1`} className="btn">
            <Download size={15} aria-hidden="true" /> Descargar QR
          </a>
        </div>
        <div className="mt-6 flex gap-4 border-t border-line pt-5 text-sm">
          {/* Navegación completa a propósito: reinicia el formulario con un nuevo ID */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/cards/new" className="font-medium text-brand hover:underline">Crear otra tarjeta</a>
          <Link href="/admin/cards" className="text-muted hover:text-ink">Ver todas</Link>
        </div>
      </div>
    );
  }

  const logoUrl = values.logoUrl;
  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Section title="Negocio">
          <Field label="Nombre del negocio" htmlFor="businessName" error={err("businessName")}>
            <input {...input("businessName")} autoComplete="off" placeholder="Barbería Carlos" />
          </Field>
          <Field label="Slug (dirección)" htmlFor="slug" error={err("slug")} hint={`${cardUrl(values.slug || "tu-slug")}`}>
            <input
              {...input("slug")}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                slugTouched.current = true;
                set("slug", slugify(e.target.value));
              }}
            />
            {suggested ? (
              <button type="button" className="self-start text-xs font-medium text-brand hover:underline" onClick={() => { slugTouched.current = true; set("slug", suggested); setSuggested(null); }}>
                Usar {suggested}
              </button>
            ) : null}
          </Field>
          <Field label="Categoría" htmlFor="category" error={err("category")}>
            <input {...input("category")} list="category-list" placeholder="Barbería" />
            <datalist id="category-list">
              {CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="Descripción" htmlFor="description" error={err("description")} wide>
            <textarea {...input("description")} rows={2} placeholder="Cortes clásicos, fade y barba con navaja." />
          </Field>
        </Section>

        <Section title="Contacto">
          <Field label="Teléfono" htmlFor="phone" error={err("phone")}>
            <input {...input("phone")} inputMode="tel" placeholder="55 1234 5678" />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={err("whatsapp")} hint="10 dígitos; se agrega el código de México (52) automáticamente.">
            <input {...input("whatsapp")} inputMode="tel" placeholder="55 1234 5678" />
          </Field>
          <Field label="Mensaje inicial de WhatsApp (opcional)" htmlFor="whatsappMessage" error={err("whatsappMessage")} wide>
            <input {...input("whatsappMessage")} placeholder="Hola, quiero agendar una cita" />
          </Field>
        </Section>

        <Section title="Redes y enlaces">
          <Field label="Instagram" htmlFor="instagramUrl" error={err("instagramUrl")} hint="@usuario o URL">
            <input {...input("instagramUrl")} autoCapitalize="none" placeholder="@barberiacarlos" />
          </Field>
          <Field label="Facebook" htmlFor="facebookUrl" error={err("facebookUrl")} hint="Nombre de página o URL">
            <input {...input("facebookUrl")} autoCapitalize="none" placeholder="barberiacarlos" />
          </Field>
          <Field label="Google Maps" htmlFor="googleMapsUrl" error={err("googleMapsUrl")} hint="Si lo dejas vacío se usa la dirección.">
            <input {...input("googleMapsUrl")} inputMode="url" placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <Field label="URL de agenda" htmlFor="bookingUrl" error={err("bookingUrl")}>
            <input {...input("bookingUrl")} inputMode="url" placeholder="https://calendly.com/..." />
          </Field>
          <Field label="Sitio web" htmlFor="websiteUrl" error={err("websiteUrl")}>
            <input {...input("websiteUrl")} inputMode="url" placeholder="https://" />
          </Field>
          <Field label="Dirección" htmlFor="address" error={err("address")}>
            <input {...input("address")} placeholder="Av. Juárez 120, Centro" />
          </Field>
          <Field label="Horario" htmlFor="schedule" error={err("schedule")}>
            <input {...input("schedule")} placeholder="Lun a Sáb 10:00 - 20:00" />
          </Field>
          <Field label="Información adicional" htmlFor="extraInfo" error={err("extraInfo")}>
            <input {...input("extraInfo")} placeholder="Estacionamiento gratuito" />
          </Field>
        </Section>

        <Section title="Botones personalizados" hint={`Hasta ${MAX_CUSTOM_BUTTONS}: menú, promociones, catálogo, pedidos...`}>
          <div className="flex flex-col gap-3 sm:col-span-2">
            {fields.map((field, i) => (
              <div key={field.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1.4fr_9rem_auto]">
                <div>
                  <input aria-label={`Texto del botón ${i + 1}`} placeholder="Menú" className="field" aria-invalid={err(`buttons.${i}.label`) ? true : undefined} {...register(`buttons.${i}.label`)} />
                  {err(`buttons.${i}.label`) ? <p role="alert" className="mt-1 text-xs text-danger">{err(`buttons.${i}.label`)}</p> : null}
                </div>
                <div>
                  <input aria-label={`URL del botón ${i + 1}`} placeholder="https://" inputMode="url" className="field" aria-invalid={err(`buttons.${i}.url`) ? true : undefined} {...register(`buttons.${i}.url`)} />
                  {err(`buttons.${i}.url`) ? <p role="alert" className="mt-1 text-xs text-danger">{err(`buttons.${i}.url`)}</p> : null}
                </div>
                <select aria-label={`Icono del botón ${i + 1}`} className="field" {...register(`buttons.${i}.icon`)}>
                  {BUTTON_ICONS.map((icon) => <option key={icon} value={icon}>{ICON_LABELS[icon] ?? icon}</option>)}
                </select>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" {...register(`buttons.${i}.isActive`)} /> Visible
                  </label>
                  <button type="button" className="btn btn-sm btn-icon" onClick={() => remove(i)} aria-label={`Eliminar botón ${i + 1}`}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {fields.length < MAX_CUSTOM_BUTTONS ? (
              <button type="button" className="btn btn-sm self-start" onClick={() => append({ label: "", url: "", icon: "link", isActive: true })}>
                <Plus size={14} aria-hidden="true" /> Agregar botón
              </button>
            ) : null}
          </div>
        </Section>

        <Section title="Diseño" hint="Elige un preset y ajusta lo que necesites.">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Presets</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_KEYS.map((key) => (
                <button key={key} type="button" onClick={() => applyPreset(key)} className="btn btn-sm gap-2">
                  <span aria-hidden="true" className="flex">
                    {[PRESETS[key].values.primaryColor, PRESETS[key].values.accentColor, PRESETS[key].values.backgroundColor].map((c, idx) => (
                      <span key={idx} className="-ml-1 size-3.5 rounded-full border border-black/10 first:ml-0" style={{ background: c }} />
                    ))}
                  </span>
                  {PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Template</span>
            <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={values.template === t}
                  onClick={() => set("template", t)}
                  className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${values.template === t ? "border-brand bg-[#e9f3f1]" : "border-line hover:bg-paper"}`}
                >
                  <span className="block text-sm font-semibold">{TEMPLATE_LABELS[t]}</span>
                  <span className="block text-xs text-muted">{TEMPLATE_HINTS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-3">
            <ColorField id="primaryColor" label="Principal" value={values.primaryColor} onChange={(v) => set("primaryColor", v)} />
            <ColorField id="accentColor" label="Acento (CTA)" value={values.accentColor} onChange={(v) => set("accentColor", v)} />
            <ColorField id="secondaryColor" label="Secundario" value={values.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
            <ColorField id="backgroundColor" label="Fondo" value={values.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
            <ColorField id="textColor" label="Texto" value={values.textColor} onChange={(v) => set("textColor", v)} />
          </div>

          <ChoiceRow label="Estructura de cabecera"><Segmented name="Estructura" value={values.layoutVariant} options={opts(LAYOUT_VARIANTS, LAYOUT_LABELS)} onChange={(v) => set("layoutVariant", v)} /></ChoiceRow>
          <ChoiceRow label="Acciones"><Segmented name="Acciones" value={values.actionsLayout} options={opts(ACTIONS_LAYOUTS, ACTIONS_LABELS)} onChange={(v) => set("actionsLayout", v)} /></ChoiceRow>
          <ChoiceRow label="Estilo de botón"><Segmented name="Estilo de botón" value={values.buttonStyle} options={opts(BUTTON_STYLES, BUTTON_STYLE_LABELS)} onChange={(v) => set("buttonStyle", v)} /></ChoiceRow>
          <ChoiceRow label="Bordes"><Segmented name="Bordes" value={values.borderRadius} options={opts(BORDER_RADII, RADIUS_LABELS)} onChange={(v) => set("borderRadius", v)} /></ChoiceRow>
          <ChoiceRow label="Sombra"><Segmented name="Sombra" value={values.shadowStyle} options={opts(SHADOW_STYLES, SHADOW_LABELS)} onChange={(v) => set("shadowStyle", v)} /></ChoiceRow>
          <Field label="Tipografía" htmlFor="font">
            <select {...register("font")} id="font" className="field">
              {FONTS.map((f) => <option key={f} value={f}>{FONT_LABELS[f]}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <Toggle id="showQr" label="Mostrar QR en la tarjeta" checked={values.showQr} onChange={(v) => set("showQr", v)} />
          </div>
        </Section>

        <Section title="Imágenes">
          <ImageUploader cardId={values.id} kind="logo" label="Logo" value={logoUrl} maxDimension={512} onChange={(u) => set("logoUrl", u)} />
          <ImageUploader cardId={values.id} kind="cover" label="Portada (estructura “Portada”)" value={values.coverImageUrl} onChange={(u) => set("coverImageUrl", u)} />
          <ChoiceRow label="Tamaño del logo"><Segmented name="Tamaño del logo" value={values.logoSize} options={opts(LOGO_SIZES, SIZE_LABELS)} onChange={(v) => set("logoSize", v)} /></ChoiceRow>
          <ChoiceRow label="Forma del logo"><Segmented name="Forma del logo" value={values.logoShape} options={opts(LOGO_SHAPES, SHAPE_LABELS)} onChange={(v) => set("logoShape", v)} /></ChoiceRow>
          <ChoiceRow label="Fondo de la página">
            <Segmented name="Fondo" value={values.backgroundMode} options={[{ value: "color", label: "Color" }, { value: "image", label: "Imagen" }]} onChange={(v) => set("backgroundMode", v)} />
          </ChoiceRow>
          {values.backgroundMode === "image" ? (
            <>
              <ImageUploader cardId={values.id} kind="background" label="Imagen de fondo" value={values.backgroundImageUrl} onChange={(u) => set("backgroundImageUrl", u)} />
              <Field label={`Capa de color sobre la imagen: ${values.backgroundOverlay}%`} htmlFor="backgroundOverlay">
                <input id="backgroundOverlay" type="range" min={0} max={90} step={5} {...register("backgroundOverlay", { valueAsNumber: true })} className="accent-brand" />
              </Field>
            </>
          ) : null}
        </Section>

        <Section title="Estado">
          <Toggle id="isActive" label="Activa" description="Visible para el público en su dirección." checked={values.isActive} onChange={(v) => set("isActive", v)} />
          <Toggle id="isPaid" label="Pagada" description="Solo control interno; no cambia la visibilidad." checked={values.isPaid} onChange={(v) => set("isPaid", v)} />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm">
          <span className="text-xs text-muted">{isDirty ? "Cambios sin guardar" : mode === "edit" ? "Todo guardado" : ""}</span>
          <button type="submit" disabled={saving} className="btn btn-primary min-w-44">
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {saving ? "Guardando..." : mode === "create" ? "Guardar y publicar" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <aside id="preview" aria-label="Vista previa" className="lg:sticky lg:top-20 lg:self-start">
        <CardPreview values={values} />
      </aside>
    </form>
  );
}

function ChoiceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
