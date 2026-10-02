import type { CSSProperties } from "react";
import type { CardAction } from "@/lib/cards/actions-builder";
import { ActionIcon } from "./ActionIcon";

type Props = {
  links: CardAction[];
  /** "icons": botones redondos. "text": enlaces de texto con subrayado. */
  variant?: "icons" | "text";
  className?: string;
  startIndex?: number;
};

export function CardSocialLinks({ links, variant = "icons", className = "", startIndex = 9 }: Props) {
  if (links.length === 0) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`} aria-label="Redes sociales">
      {links.map((link, i) => (
        <li key={link.key} className="cd-rise" style={{ "--i": startIndex + i } as CSSProperties}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={variant === "icons" ? "cd-icon-btn" : "cd-link inline-flex items-center gap-2 text-sm font-medium underline"}
          >
            {variant === "icons" ? (
              <ActionIcon name={link.icon} size={20} />
            ) : (
              link.label
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
