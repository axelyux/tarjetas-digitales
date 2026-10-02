import { ACTION_CONFIG, isExternalHref, resolveActionHref, type ActionIconKey } from "./action-types";
import type { ActionType } from "./constants";
import type { DigitalCardData } from "./types";

export type RenderedAction = {
  key: string;
  type: ActionType;
  label: string;
  href: string;
  icon: ActionIconKey;
  external: boolean;
};

export type BuiltActions = {
  /** Acciones principales en el orden configurado (la primera es el CTA destacado). */
  main: RenderedAction[];
  /** Redes sociales (fila de iconos). */
  social: RenderedAction[];
};

/**
 * Convierte las acciones guardadas en botones renderizables.
 * Descarta acciones deshabilitadas o sin destino válido: nunca hay botones muertos.
 */
export function buildActions(data: Pick<DigitalCardData, "actions">): BuiltActions {
  const main: RenderedAction[] = [];
  const social: RenderedAction[] = [];

  for (const action of data.actions) {
    if (!action.enabled) continue;
    const href = resolveActionHref(action.type, action.value, action.metadata);
    if (!href) continue;
    const config = ACTION_CONFIG[action.type];
    const rendered: RenderedAction = {
      key: action.id,
      type: action.type,
      label: action.label.trim() || config.label,
      href,
      icon: config.customIcon ? action.icon : config.icon,
      external: isExternalHref(href),
    };
    (config.social ? social : main).push(rendered);
  }
  return { main, social };
}
