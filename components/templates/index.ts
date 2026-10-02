import { createElement, type ComponentType } from "react";
import type { Template } from "@/lib/cards/constants";
import { BoldTemplate } from "./BoldTemplate";
import { EditorialTemplate } from "./EditorialTemplate";
import { ElegantTemplate } from "./ElegantTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { SoftTemplate } from "./SoftTemplate";
import type { TemplateProps } from "./types";

const REGISTRY: Record<Template, ComponentType<TemplateProps>> = {
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  elegant: ElegantTemplate,
  bold: BoldTemplate,
  soft: SoftTemplate,
  editorial: EditorialTemplate,
};

/** template = "modern" -> ModernTemplate. Cualquier valor desconocido cae en Modern. */
export function getTemplateComponent(template: string): ComponentType<TemplateProps> {
  return REGISTRY[template as Template] ?? ModernTemplate;
}

/** Renderiza el template elegido para unos datos. */
export function renderTemplate(props: TemplateProps) {
  const Template = getTemplateComponent(props.data.template);
  return createElement(Template, props);
}
