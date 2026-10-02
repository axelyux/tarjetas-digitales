import type { ReactNode } from "react";

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-surface p-5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {hint ? <p className="-mt-1 mb-4 text-xs text-muted">{hint}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, wide = false, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  name, value, options, onChange,
}: { name: string; value: T; options: readonly Option<T>[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            o.value === value ? "border-brand bg-brand text-white" : "border-line bg-surface hover:bg-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  id, label, description, checked, onChange,
}: { id: string; label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${checked ? "bg-brand" : "bg-[#cfcdc6]"}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
