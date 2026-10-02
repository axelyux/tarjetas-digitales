import { CircleSlash, SearchX, TriangleAlert, type LucideIcon } from "lucide-react";

type Kind = "inactive" | "missing" | "error";

const COPY: Record<Kind, { title: string; text: string; Icon: LucideIcon }> = {
  inactive: {
    title: "Esta tarjeta digital no está disponible actualmente",
    text: "Vuelve a intentarlo más tarde o contacta directamente al negocio.",
    Icon: CircleSlash,
  },
  missing: {
    title: "No encontramos esta tarjeta",
    text: "Revisa que la dirección esté bien escrita.",
    Icon: SearchX,
  },
  error: {
    title: "No pudimos cargar la tarjeta",
    text: "Hubo un problema temporal. Intenta de nuevo en unos minutos.",
    Icon: TriangleAlert,
  },
};

export function CardUnavailable({ kind }: { kind: Kind }) {
  const { title, text, Icon } = COPY[kind];
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-muted">
          <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h1 className="text-balance text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-pretty text-sm text-muted">{text}</p>
      </div>
    </main>
  );
}
