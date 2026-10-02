"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Download, ExternalLink, Eye, Loader2, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { saveCard } from "@/lib/cards/actions";
import {
  ACTIONS_LAYOUTS, BORDER_RADII, BUTTON_STYLES, COVER_MODES, FONTS, FONT_LABELS, LAYOUT_LABELS, LAYOUT_VARIANTS, LOGO_SHAPES,
  LOGO_SIZES, PAYMENT_LABELS, PAYMENT_STATUSES, PUBLICATION_HINTS, PUBLICATION_LABELS, PUBLICATION_STATUSES,
  SHADOW_STYLES, TEMPLATES, TEMPLATE_LABELS, type PublicationStatus,
} from "@/lib/cards/constants";
import { PRESETS, PRESET_KEYS, type PresetKey } from "@/lib/cards/presets";
import { cardInputSchema, type CardInput } from "@/lib/cards/schema";
import { slugify } from "@/lib/cards/slug";
import { contrastRatio } from "@/lib/color";
import { cardUrl } from "@/lib/site";
import { ActionsEditor } from "./ActionsEditor";
import { BranchesEditor } from "./BranchesEditor";
import { CardPreview } from "./CardPreview";
import { ColorField } from "./ColorField";
import { CopyButton } from "./CopyButton";
import { Field, Section, Segmented, Toggle, fieldError } from "./form-ui";
import { HoursEditor } from "./HoursEditor";
import { ImageUploader } from "./ImageUploader";

const CATEGORIES = [
  "Barbería", "Salón de belleza", "Uñas", "Restaurante", "Cafetería", "Taller mecánico", "Dentista", "Médico",
  "Gimnasio", "Tienda", "Hotel", "Fotografía", "Inmobiliaria", "Profesional independiente",
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
const COVER_LABELS = { color: "Color sólido", gradient: "Degradado", image: "Imagen" } as const;

type Props = {
  initial: CardInput;
  mode: "create" | "edit";
  /** Solo edición: updated_at original (control de concurrencia) y token de vista previa privada. */
  updatedAt?: string;
  previewToken?: string;
};

export function CardForm({ initial, mode, updatedAt, previewToken }: Props) {
  const router = useRouter();
  const methods = useForm<CardInput>({ resolver: zodResolver(cardInputSchema), defaultValues: initial, mode: "onTouched" });
  const { register, handleSubmit, getValues, setValue, setError, reset, control, formState: { errors, isDirty } } = methods;

  const values = useWatch({ control }) as CardInput;
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const expectedRef = useRef(updatedAt);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const slugTouched = useRef(mode === "edit");
  const [suggested, setSuggested] = useState<string | null>(null);

  // Slug automático desde el nombre mientras no se edite manualmente (solo tarjetas nuevas).
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

  const err = (name: string) => fieldError(errors, name);
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

  async function persist(data: CardInput) {
    if (savingRef.current) return; // doble clic / doble Enter
    savingRef.current = true;
    setSaving(true);
    setSuggested(null);
    setNetworkError(false);
    try {
      const result =
        mode === "create" ? await saveCard("create", data) : await saveCard("update", data, expectedRef.current);
      if (!result.ok) {
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(key as FieldPath<CardInput>, { message });
        }
        if (result.suggestedSlug) setSuggested(result.suggestedSlug);
        if (result.conflict) setConflict(true);
        toast.error(result.error);
        return;
      }
      if (mode === "create") {
        setCreated({ id: result.data.id, slug: result.data.slug });
        window.scrollTo({ top: 0 });
      } else {
        expectedRef.current = result.data.updatedAt;
        reset(data); // el formulario queda "limpio" con lo guardado
        toast.success("Cambios guardados");
        router.refresh();
      }
    } catch {
      // Sin respuesta del servidor: no sabemos si se guardó. Los datos siguen en pantalla para reintentar.
      setNetworkError(true);
      toast.error("No se pudo guardar. Tus cambios no se confirmaron.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function submit(status?: PublicationStatus) {
    // Los botones sin destino se descartan antes de validar (filas iniciales vacías).
    const current = getValues();
    const nonEmpty = current.actions.filter((a) => a.value.trim() !== "");
    if (nonEmpty.length !== current.actions.length) set("actions", nonEmpty);
    if (status) setValue("publicationStatus", status, { shouldDirty: true });
    void handleSubmit(persist, () => toast.error("Revisa los campos marcados en rojo."))();
  }

  if (created) {
    const url = cardUrl(created.slug);
    const status = getValues("publicationStatus");
    const live = status === "active";
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#e3f3ec] text-[#116149]">
          <Check size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Tarjeta creada</h1>
        <p className="mt-1 text-sm text-muted">
          {live ? "Ya está disponible en esta dirección:" : `Quedó como “${PUBLICATION_LABELS[status]}”. Su dirección será:`}
        </p>
        <p className="mt-3 break-all rounded-lg bg-paper px-3 py-2.5 font-mono text-sm">{url}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton value={url} label="Copiar" />
          {live ? (
            <Link href={`/${created.slug}`} target="_blank" className="btn">
              <ExternalLink size={15} aria-hidden="true" /> Ver
            </Link>
          ) : null}
          <Link href={`/admin/cards/${created.id}/edit`} className="btn">
            <Pencil size={15} aria-hidden="true" /> Editar
          </Link>
          <a href={`/api/qr/${created.slug}?format=png&download=1`} className="btn">
            <Download size={15} aria-hidden="true" /> QR PNG
          </a>
          <a href={`/api/qr/${created.slug}?format=svg&download=1`} className="btn">
            <Download size={15} aria-hidden="true" /> QR SVG
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

  const textContrast = contrastRatio(values.textColor, values.backgroundColor);

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {conflict ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f0c36d] bg-[#fdf3e2] p-4 text-sm text-warn">
              <TriangleAlert size={18} aria-hidden="true" />
              <span className="flex-1">Esta tarjeta cambió en otra sesión y tus cambios no se guardaron.</span>
              <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>Recargar</button>
            </div>
          ) : null}
          {networkError ? (
            <div role="alert" className="flex items-center gap-3 rounded-xl border border-[#f0c36d] bg-[#fdf3e2] p-4 text-sm text-warn">
              <TriangleAlert size={18} aria-hidden="true" />
              No se pudo guardar. Tus cambios no se confirmaron; siguen aquí para que reintentes.
            </div>
          ) : null}

          <Section title="Negocio">
            <Field label="Nombre del negocio" htmlFor="businessName" error={err("businessName")}>
              <input {...input("businessName")} autoComplete="off" placeholder="Barbería Carlos" maxLength={80} />
            </Field>
            <Field label="Slug (dirección)" htmlFor="slug" error={err("slug")} hint={cardUrl(values.slug || "tu-slug")}>
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
              {mode === "edit" && values.slug !== initial.slug && values.slug ? (
                <p className="text-xs text-muted">La dirección anterior (/{initial.slug}) seguirá funcionando con una redirección.</p>
              ) : null}
            </Field>
            <Field label="Categoría" htmlFor="category" error={err("category")}>
              <input {...input("category")} list="category-list" placeholder="Barbería" />
              <datalist id="category-list">
                {CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Cliente (uso interno)" htmlFor="customerName" error={err("customerName")} hint="Agrupa sucursales del mismo cliente en el panel.">
              <input {...input("customerName")} placeholder="Carlos Pérez" />
            </Field>
            <Field label="Descripción" htmlFor="description" error={err("description")} wide hint={`${values.description?.length ?? 0}/400`}>
              <textarea {...input("description")} rows={2} maxLength={400} placeholder="Cortes clásicos, fade y barba con navaja." />
            </Field>
          </Section>

          <Section title="Botones" hint="Se muestran en este orden; el primero es el botón destacado. WhatsApp, Maps, enlaces, PDF... los que necesites.">
            <ActionsEditor cardId={values.id} />
          </Section>

          <Section title="Información del negocio" hint="Todo es opcional: lo que quede vacío no se muestra.">
            <Field label="Dirección" htmlFor="address" error={err("address")}>
              <input {...input("address")} placeholder="Av. Juárez 120, Centro" />
            </Field>
            <Field label="Nota de horario (opcional)" htmlFor="schedule" error={err("schedule")}>
              <input {...input("schedule")} placeholder="Abrimos días festivos con cita" />
            </Field>
            <Field label="Información adicional" htmlFor="extraInfo" error={err("extraInfo")} wide>
              <input {...input("extraInfo")} placeholder="Estacionamiento gratuito" />
            </Field>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Horario semanal</span>
              <HoursEditor idPrefix="hours" value={values.hours ?? null} onChange={(h) => set("hours", h)} />
            </div>
          </Section>

          <Section title="Sucursales" hint="Para negocios con varias ubicaciones. Cada una con su dirección, contacto y horario.">
            <BranchesEditor />
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
              <ColorField id="accentColor" label="Acento (botón destacado)" value={values.accentColor} onChange={(v) => set("accentColor", v)} />
              <ColorField id="secondaryColor" label="Secundario" value={values.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
              <ColorField id="backgroundColor" label="Fondo" value={values.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
              <ColorField id="textColor" label="Texto" value={values.textColor} onChange={(v) => set("textColor", v)} />
            </div>
            {textContrast < 4.5 ? (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-[#fdf3e2] p-3 text-xs text-warn sm:col-span-2">
                <TriangleAlert size={15} aria-hidden="true" className="mt-px shrink-0" />
                El texto y el fondo tienen poco contraste ({textContrast.toFixed(1)}:1; se recomienda 4.5:1 o más). Puedes dejarlo así, pero puede ser difícil de leer.
              </p>
            ) : null}

            <ChoiceRow label="Estructura de cabecera"><Segmented name="Estructura" value={values.layoutVariant} options={opts(LAYOUT_VARIANTS, LAYOUT_LABELS)} onChange={(v) => set("layoutVariant", v)} /></ChoiceRow>
            <ChoiceRow label="Botones"><Segmented name="Disposición de botones" value={values.actionsLayout} options={opts(ACTIONS_LAYOUTS, ACTIONS_LABELS)} onChange={(v) => set("actionsLayout", v)} /></ChoiceRow>
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
            <ImageUploader
              cardId={values.id} kind="logo" label="Logo" value={values.logoUrl} maxDimension={768}
              onChange={(u, ratio) => { set("logoUrl", u); set("logoRatio", ratio ?? 1); }}
            />
            <div className="flex flex-col gap-3 rounded-lg border border-line p-3 sm:col-span-2">
              <ChoiceRow label="Banner superior (estructura “Portada”)">
                <Segmented name="Estilo del banner" value={values.coverMode} options={opts(COVER_MODES, COVER_LABELS)} onChange={(v) => set("coverMode", v)} />
              </ChoiceRow>
              {values.layoutVariant !== "hero" ? (
                <p className="text-xs text-muted">El banner se muestra con la estructura de cabecera “Portada”. <button type="button" className="underline" onClick={() => set("layoutVariant", "hero")}>Activarla</button></p>
              ) : null}
              {values.coverMode === "gradient" ? (
                <div className="grid grid-cols-2 gap-4">
                  <ColorField id="primaryColorCover" label="Color inicial (el principal)" value={values.primaryColor} onChange={(v) => set("primaryColor", v)} />
                  <ColorField id="coverColor2" label="Color final" value={values.coverColor2} onChange={(v) => set("coverColor2", v)} />
                </div>
              ) : null}
              {values.coverMode === "image" ? (
                <ImageUploader cardId={values.id} kind="cover" label="Imagen del banner" value={values.coverImageUrl} onChange={(u) => set("coverImageUrl", u)} />
              ) : null}
              <Toggle id="coverFade" label="Difuminar el borde inferior" description="El banner se funde suavemente con el fondo de la tarjeta." checked={values.coverFade} onChange={(v) => set("coverFade", v)} />
            </div>
            <ChoiceRow label="Tamaño del logo"><Segmented name="Tamaño del logo" value={values.logoSize} options={opts(LOGO_SIZES, SIZE_LABELS)} onChange={(v) => set("logoSize", v)} /></ChoiceRow>
            <ChoiceRow label="Forma del logo (logos cuadrados)"><Segmented name="Forma del logo" value={values.logoShape} options={opts(LOGO_SHAPES, SHAPE_LABELS)} onChange={(v) => set("logoShape", v)} /></ChoiceRow>
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
            <Field label="Publicación" htmlFor="publicationStatus" hint={PUBLICATION_HINTS[values.publicationStatus]}>
              <select {...register("publicationStatus")} id="publicationStatus" className="field">
                {PUBLICATION_STATUSES.map((s) => <option key={s} value={s}>{PUBLICATION_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Pago" htmlFor="paymentStatus" hint="Control interno. No cambia la visibilidad.">
              <select {...register("paymentStatus")} id="paymentStatus" className="field">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
              </select>
            </Field>
            {mode === "edit" && previewToken ? (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Vista previa privada</span>
                <p className="text-xs text-muted">Enlace secreto para que el cliente vea la tarjeta antes de publicarla.</p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={`${typeof window === "undefined" ? "" : window.location.origin}/p/${previewToken}`} label="Copiar enlace" />
                  <Link href={`/p/${previewToken}`} target="_blank" className="btn">
                    <Eye size={15} aria-hidden="true" /> Abrir vista previa
                  </Link>
                </div>
              </div>
            ) : null}
          </Section>

          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm">
            <span className="text-xs text-muted" aria-live="polite">
              {saving ? "Guardando..." : isDirty ? "Cambios sin guardar" : mode === "edit" ? "Todo guardado" : ""}
            </span>
            <div className="flex gap-2">
              {mode === "create" ? (
                <button type="button" disabled={saving} className="btn" onClick={() => submit("draft")}>
                  Guardar borrador
                </button>
              ) : null}
              <button
                type="button"
                disabled={saving}
                className="btn btn-primary min-w-44"
                onClick={() => submit(mode === "create" ? "active" : undefined)}
              >
                {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                {saving ? "Guardando..." : mode === "create" ? "Guardar y publicar" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>

        <aside id="preview" aria-label="Vista previa" className="lg:sticky lg:top-20 lg:self-start">
          <CardPreview values={values} />
        </aside>
      </form>
    </FormProvider>
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
