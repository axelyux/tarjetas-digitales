import type { CSSProperties } from "react";
import type { RenderedAction } from "@/lib/cards/actions-builder";
import type { ButtonStyle } from "@/lib/cards/constants";
import { ActionIcon } from "./ActionIcon";

type Props = {
  action: RenderedAction;
  buttonStyle: ButtonStyle;
  /** CTA principal: usa el color de acento. */
  cta?: boolean;
  style?: CSSProperties;
  className?: string;
};

export function CardButton({ action, buttonStyle, cta = false, style, className = "" }: Props) {
  return (
    <a
      href={action.href}
      {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`cd-btn cd-rise ${className}`}
      data-action-type={action.type}
      data-action-id={action.key}
      data-style={buttonStyle}
      data-cta={cta}
      style={style}
    >
      <ActionIcon name={action.icon} size={cta ? 22 : 20} />
      <span>{action.label}</span>
    </a>
  );
}
