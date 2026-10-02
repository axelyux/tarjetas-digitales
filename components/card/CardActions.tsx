import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { RenderedAction } from "@/lib/cards/actions-builder";
import type { DigitalCardData } from "@/lib/cards/types";
import { ActionIcon } from "./ActionIcon";
import { CardButton } from "./CardButton";

type Presentation = "buttons" | "rows" | "numbered";

type Props = {
  actions: RenderedAction[];
  data: Pick<DigitalCardData, "actionsLayout" | "buttonStyle">;
  presentation?: Presentation;
  /** Indice inicial de animacion escalonada. */
  startIndex?: number;
};

const stagger = (i: number) => ({ "--i": i } as CSSProperties);

export function CardActions({ actions, data, presentation = "buttons", startIndex = 4 }: Props) {
  if (actions.length === 0) return null;

  if (presentation === "rows" || presentation === "numbered") {
    return (
      <nav aria-label="Acciones" className="flex flex-col">
        {actions.map((action, i) => (
          <a
            key={action.key}
            href={action.href}
            data-action-type={action.type}
            data-action-id={action.key}
            {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="cd-rise cd-link group flex items-center gap-4 border-t border-[color-mix(in_srgb,var(--card-text)_16%,transparent)] py-4 last:border-b"
            style={stagger(startIndex + i)}
          >
            {presentation === "numbered" ? (
              <span className="cd-muted w-7 text-sm tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            ) : (
              <span className="text-[var(--card-accent)]"><ActionIcon name={action.icon} /></span>
            )}
            <span className={`flex-1 ${presentation === "numbered" ? "text-xl font-semibold" : "text-base font-medium"}`}>
              {action.label}
            </span>
            <ArrowUpRight
              size={18}
              aria-hidden="true"
              className="cd-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        ))}
      </nav>
    );
  }

  const [cta, ...rest] = actions;
  const grid = data.actionsLayout === "grid";
  return (
    <nav aria-label="Acciones" className="flex flex-col gap-3">
      {cta ? <CardButton action={cta} cta buttonStyle={data.buttonStyle} style={stagger(startIndex)} /> : null}
      {rest.length > 0 ? (
        <div className={grid ? "grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2" : "flex flex-col gap-3"}>
          {rest.map((action, i) => (
            <CardButton key={action.key} action={action} buttonStyle={data.buttonStyle} style={stagger(startIndex + 1 + i)} />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
