import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { resolveActionHref } from "@/lib/cards/action-types";
import { buildActions } from "@/lib/cards/actions-builder";
import { emptyAction, emptyCardInput } from "@/lib/cards/defaults";
import { defaultHours, formatHours, sanitizeHours } from "@/lib/cards/hours";
import { isHttpUrl, normalizeUrlInput, normalizeWhatsapp, whatsappLink } from "@/lib/cards/links";
import {
  adminCardToInput, inputToActionRows, inputToCardData, inputToCardRow, rowToAdminCard, rowToCardData,
} from "@/lib/cards/mapper";
import { cardInputSchema, type CardInput } from "@/lib/cards/schema";
import { isReservedSlug, nextSlug, slugify } from "@/lib/cards/slug";
import { validateImage, validateUpload } from "@/lib/cards/upload-validation";
import { TEMPLATES } from "@/lib/cards/constants";
import { contrastRatio, readableOn } from "@/lib/color";
import { buildDemoCard, demoAction } from "@/lib/demo";
import { DigitalCard } from "@/components/card/DigitalCard";
import { getTemplateComponent } from "@/components/templates";
import { ModernTemplate } from "@/components/templates/ModernTemplate";

const ID = "6f1d0b8e-7c1a-4a55-9d1c-0d3f4c2b9a11";
const valid = (over: Partial<CardInput> = {}): CardInput => ({
  ...emptyCardInput(ID), businessName: "Barbería Carlos", slug: "barberia-carlos", actions: [], ...over,
});
const action = (over: Partial<CardInput["actions"][number]>): CardInput["actions"][number] => ({
  ...emptyAction("custom_url"), ...over,
});

describe("slug", () => {
  it("normaliza acentos, espacios, símbolos y mayúsculas", () => {
    expect(slugify("  Barbería  Carlos!! ")).toBe("barberia-carlos");
    expect(slugify('Café & Pan "El Güero"')).toBe("cafe-pan-el-guero");
  });
  it("genera sufijos incrementales y detecta reservados", () => {
    expect(nextSlug("barberia-carlos")).toBe("barberia-carlos-2");
    expect(nextSlug("barberia-carlos-2")).toBe("barberia-carlos-3");
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("p")).toBe(true);
  });
});

describe("URLs y destinos", () => {
  it("normaliza dominios sin esquema y rechaza esquemas peligrosos", () => {
    expect(normalizeUrlInput("instagram.com/negocio")).toBe("https://instagram.com/negocio");
    expect(normalizeUrlInput("https://ok.com/x?y=1")).toBe("https://ok.com/x?y=1");
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "vbscript:x", "file:///etc/passwd", "//evil.com", "no es url", "", "ftp://x.com"]) {
      expect(normalizeUrlInput(bad), bad).toBeNull();
    }
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });
  it("WhatsApp: normaliza a formato internacional y codifica el mensaje", () => {
    expect(normalizeWhatsapp("55 1234 5678")).toBe("525512345678");
    expect(normalizeWhatsapp("+52 1 55 1234 5678")).toBe("525512345678");
    expect(whatsappLink("5512345678", "Hola, ¿citas? & más")).toBe(
      "https://wa.me/525512345678?text=Hola%2C%20%C2%BFcitas%3F%20%26%20m%C3%A1s");
  });
  it("resuelve cada tipo de acción a un href seguro", () => {
    expect(resolveActionHref("whatsapp", "5512345678", { message: "Hola" })).toBe("https://wa.me/525512345678?text=Hola");
    expect(resolveActionHref("phone", "(55) 1234-5678")).toBe("tel:5512345678");
    expect(resolveActionHref("email", "a@b.com")).toBe("mailto:a@b.com");
    expect(resolveActionHref("email", "javascript:alert(1)//@x.co")).toBeNull();
    expect(resolveActionHref("instagram", "@negocio")).toBe("https://instagram.com/negocio");
    expect(resolveActionHref("facebook", "negocio")).toBe("https://facebook.com/negocio");
    expect(resolveActionHref("tiktok", "@negocio")).toBe("https://tiktok.com/@negocio");
    expect(resolveActionHref("maps", "https://maps.app.goo.gl/abc")).toBe("https://maps.app.goo.gl/abc");
    expect(resolveActionHref("maps", "Av. Juárez 120, Centro")).toContain("google.com/maps/search");
    expect(resolveActionHref("maps", "javascript:alert(1)")).toBeNull();
    expect(resolveActionHref("custom_url", "mercadolibre.com.mx/p/MLM1")).toBe("https://mercadolibre.com.mx/p/MLM1");
    expect(resolveActionHref("pdf", "https://x.com/menu.pdf")).toBe("https://x.com/menu.pdf");
    expect(resolveActionHref("custom_url", "javascript:alert(1)")).toBeNull();
    expect(resolveActionHref("custom_url", "")).toBeNull();
    expect(resolveActionHref("phone", "abc")).toBeNull();
  });
});

describe("cardInputSchema", () => {
  it("A/C: tarjeta mínima (sin logo, sin redes, sin acciones) es válida", () => {
    expect(cardInputSchema.safeParse(valid({ actions: [] })).success).toBe(true);
  });
  it("A: solo WhatsApp es válida", () => {
    const r = cardInputSchema.safeParse(valid({ actions: [action({ type: "whatsapp", value: "5512345678" })] }));
    expect(r.success).toBe(true);
  });
  it("E: CUSTOM_URL con texto y URL; F/G: URL inválida o javascript: se rechazan", () => {
    expect(cardInputSchema.safeParse(valid({ actions: [action({ label: "Ver menú", value: "https://ex.com/menu" })] })).success).toBe(true);
    const missingLabel = cardInputSchema.safeParse(valid({ actions: [action({ label: "", value: "https://ex.com" })] }));
    expect(missingLabel.success).toBe(false);
    for (const value of ["no es url", "javascript:alert(1)", "data:text/html,<script>", "vbscript:x"]) {
      expect(cardInputSchema.safeParse(valid({ actions: [action({ label: "x", value })] })).success, value).toBe(false);
    }
  });
  it("rechaza acciones sin destino (nunca botones muertos) y teléfonos inválidos", () => {
    expect(cardInputSchema.safeParse(valid({ actions: [action({ type: "maps", value: "" })] })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ actions: [action({ type: "whatsapp", value: "abc" })] })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ actions: [action({ type: "whatsapp", value: "12" })] })).success).toBe(false);
  });
  it("D: permite varias acciones, incluidos dos WhatsApp", () => {
    const actions = [
      action({ type: "whatsapp", label: "Citas", value: "5511111111" }),
      action({ type: "whatsapp", label: "Ventas", value: "5522222222" }),
      action({ type: "pdf", value: "https://ex.com/catalogo.pdf" }),
      action({ type: "email", value: "hola@negocio.com" }),
    ];
    expect(cardInputSchema.safeParse(valid({ actions })).success).toBe(true);
  });
  it("limita acciones y sucursales", () => {
    const many = Array.from({ length: 21 }, () => action({ type: "website", value: "https://a.com" }));
    expect(cardInputSchema.safeParse(valid({ actions: many })).success).toBe(false);
  });
  it("H: slugs inválidos o reservados", () => {
    for (const slug of ["Barberia Carlos", "-abc", "abc-", "a--b", "admin", "a", "p"]) {
      expect(cardInputSchema.safeParse(valid({ slug })).success, slug).toBe(false);
    }
  });
  it("O: acentos, ñ y caracteres especiales en el nombre", () => {
    const name = 'Café & Pan "El Güero" <b>Ñandú</b> 🙂';
    const parsed = cardInputSchema.safeParse(valid({ businessName: name }));
    expect(parsed.success).toBe(true);
    // El contenido se trata como texto: nunca se inserta como HTML (React escapa).
    const html = renderToStaticMarkup(createElement(DigitalCard, { data: { ...buildDemoCard("modern"), businessName: name } }));
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>Ñandú");
  });
  it("P/Q: nombre o descripción excesivos se rechazan", () => {
    expect(cardInputSchema.safeParse(valid({ businessName: "N".repeat(81) })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ description: "d".repeat(401) })).success).toBe(false);
  });
  it("valida colores, ids y sucursales", () => {
    expect(cardInputSchema.safeParse(valid({ primaryColor: "red" })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ primaryColor: "#ZZZZZZ" })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ id: "1; drop table cards" })).success).toBe(false);
    const branch = { name: "Centro", address: "", mapsUrl: "", phone: "", whatsapp: "", hours: null, enabled: true };
    expect(cardInputSchema.safeParse(valid({ branches: [branch, { ...branch, name: "Madero" }] })).success).toBe(true);
    expect(cardInputSchema.safeParse(valid({ branches: [{ ...branch, name: "" }] })).success).toBe(false);
    expect(cardInputSchema.safeParse(valid({ branches: [{ ...branch, mapsUrl: "javascript:1" }] })).success).toBe(false);
  });
  it("estados de publicación y pago son independientes", () => {
    for (const [publicationStatus, paymentStatus] of [["preview", "pending"], ["active", "paid"], ["inactive", "paid"], ["draft", "cancelled"]] as const) {
      expect(cardInputSchema.safeParse(valid({ publicationStatus, paymentStatus })).success).toBe(true);
    }
    expect(cardInputSchema.safeParse(valid({ publicationStatus: "paid" as never })).success).toBe(false);
  });
});

describe("mapper", () => {
  it("S: duplicar conserva diseño y acciones (roundtrip admin -> formulario)", () => {
    const row = {
      id: ID, slug: "a", business_name: "A", template: "bold", primary_color: "#111111",
      card_actions: [{ id: "1", type: "whatsapp", value: "525512345678", sort_order: 0, enabled: true, metadata: { message: "Hola" } }],
      card_branches: [{ id: "b", name: "Centro", sort_order: 0, enabled: true }],
      publication_status: "active", payment_status: "paid", updated_at: "2026-01-01T00:00:00.123456+00:00",
    };
    const input = adminCardToInput(rowToAdminCard(row));
    expect(input.template).toBe("bold");
    expect(input.actions[0]).toMatchObject({ type: "whatsapp", message: "Hola" });
    expect(input.branches).toHaveLength(1);
    expect(rowToAdminCard(row).updatedAt).toBe("2026-01-01T00:00:00.123456+00:00");
  });
  it("T: cambiar de template no toca el contenido", () => {
    const base = valid({ actions: [action({ type: "whatsapp", value: "5512345678" })] });
    const a = inputToCardRow({ ...base, template: "minimal" });
    const b = inputToCardRow({ ...base, template: "editorial" });
    expect({ ...a, template: "" }).toEqual({ ...b, template: "" });
    expect(a.template).not.toBe(b.template);
  });
  it("normaliza valores al guardar (WhatsApp internacional, redes como URL)", () => {
    const rows = inputToActionRows([
      action({ type: "whatsapp", value: "55 1234 5678", message: "Hola" }),
      action({ type: "instagram", value: "@negocio" }),
      action({ type: "custom_url", label: "Menú", value: "ex.com/menu" }),
    ]);
    expect(rows.map((r) => r.value)).toEqual(["525512345678", "https://instagram.com/negocio", "https://ex.com/menu"]);
    expect(rows[0]?.metadata).toEqual({ message: "Hola" });
  });
  it("el preview tolera datos a medias", () => {
    const data = inputToCardData(valid({ businessName: "", logoUrl: "no-es-url", actions: [action({ value: "xx" })] }));
    expect(data.logoUrl).toBeUndefined();
    expect(buildActions(data).main).toHaveLength(0);
  });
});

describe("renderer tolerante a datos corruptos (BD)", () => {
  const corrupt = {
    slug: "x", business_name: "X", template: "no_existe", primary_color: "#ZZZZZZ", accent_color: null,
    border_radius: "gigante", font: 42, logo_ratio: "abc", logo_url: "javascript:alert(1)", hours: "basura",
    background_overlay: "999", show_qr: "si",
    card_actions: [
      { id: "1", type: "tipo_nuevo", value: "https://ex.com", icon: "icono_inexistente", sort_order: 1, enabled: true },
      { id: "2", type: "whatsapp", value: "5512345678", sort_order: 1, enabled: true },
      { id: "3", type: "maps", value: null, sort_order: 0, enabled: true },
      { id: "4", type: "website", value: "https://off.com", sort_order: null, enabled: false },
    ],
  };
  it("usa fallbacks en lugar de fallar", () => {
    const data = rowToCardData(corrupt);
    expect(data.template).toBe("modern");
    expect(data.primaryColor).toBe("#1e293b");
    expect(data.borderRadius).toBe("md");
    expect(data.logoUrl).toBeUndefined();
    expect(data.logoRatio).toBe(1);
    expect(data.hours).toBeNull();
    expect(data.backgroundOverlay).toBe(90);
    expect(data.actions.map((a) => a.id)).toEqual(["1", "2"]); // orden estable aunque sort_order se repita; sin deshabilitadas ni vacías
    expect(data.actions[0]?.type).toBe("custom_url");
    expect(data.actions[0]?.icon).toBe("link");
  });
  it("renderiza todos los templates sin fallar, sin href vacío y sin 'undefined'", () => {
    for (const template of TEMPLATES) {
      for (const data of [
        { ...rowToCardData(corrupt), template },
        { ...buildDemoCard(template), actions: [], branches: [], hours: null, address: undefined, extraInfo: undefined, description: undefined, category: undefined },
        { ...buildDemoCard(template), businessName: "N".repeat(80), description: "p".repeat(400), address: "Calle muy larga ".repeat(12) },
      ]) {
        const html = renderToStaticMarkup(createElement(DigitalCard, { data }));
        expect(html, template).not.toContain('href=""');
        expect(html, template).not.toMatch(/>undefined<|>null</);
        expect(html, template).toContain("<h1");
      }
    }
  });
});

describe("acciones renderizadas", () => {
  const demo = () => buildDemoCard("modern");
  it("respeta el orden configurado y separa redes", () => {
    const { main, social } = buildActions(demo());
    expect(main.map((a) => a.label)).toEqual(["WhatsApp citas", "WhatsApp ventas", "Agendar cita", "Cómo llegar", "Promociones", "Descargar PDF"]);
    expect(social.map((a) => a.type)).toEqual(["instagram", "facebook"]);
    const reversed = buildActions({ actions: [...demo().actions].reverse().map((a, i) => ({ ...a, sortOrder: i })) });
    expect(reversed.social[0]?.type).toBe("facebook");
  });
  it("B/1: sin Instagram, el botón desaparece; sin WhatsApp no hay botón muerto", () => {
    const d = demo();
    const noIg = buildActions({ actions: d.actions.filter((a) => a.type !== "instagram" && a.type !== "whatsapp") });
    expect(noIg.social.map((a) => a.type)).toEqual(["facebook"]);
    expect(noIg.main.some((a) => a.type === "whatsapp")).toBe(false);
  });
  it("acciones deshabilitadas o sin destino no se muestran", () => {
    const actions = [
      demoAction({ type: "instagram", value: "@x", enabled: false }, 0),
      demoAction({ type: "custom_url", value: "javascript:alert(1)", label: "malo" }, 1),
      demoAction({ type: "website", value: "https://ok.com" }, 2),
    ];
    const { main, social } = buildActions({ actions });
    expect(social).toHaveLength(0);
    expect(main.map((a) => a.type)).toEqual(["website"]);
  });
  it("los enlaces externos llevan rel=noopener noreferrer", () => {
    const html = renderToStaticMarkup(createElement(DigitalCard, { data: demo() }));
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('data-action-type="whatsapp"');
  });
});

describe("horarios y sucursales", () => {
  it("agrupa días consecutivos y omite horarios vacíos", () => {
    const h = defaultHours();
    expect(formatHours(h)).toEqual([{ days: "Lun - Sáb", text: "09:00 - 18:00" }, { days: "Dom", text: "Cerrado" }]);
    expect(formatHours(null)).toEqual([]);
    const allClosed = Object.fromEntries(Object.keys(h).map((d) => [d, { closed: true, open: "", close: "" }]));
    expect(formatHours(allClosed as never)).toEqual([]);
  });
  it("sanea horarios corruptos", () => {
    expect(sanitizeHours("basura")).toBeNull();
    expect(sanitizeHours({ mon: 1 })).toBeNull();
    expect(sanitizeHours(defaultHours())).not.toBeNull();
  });
  it("R: dos sucursales se renderizan sin código nuevo", () => {
    const html = renderToStaticMarkup(createElement(DigitalCard, { data: buildDemoCard("minimal") }));
    expect(html).toContain("Sucursal Centro");
    expect(html).toContain("Sucursal Madero");
    expect(html).toContain("wa.me/525511112222");
  });
  it("sin horarios ni sucursales no hay secciones vacías", () => {
    const html = renderToStaticMarkup(createElement(DigitalCard, {
      data: { ...buildDemoCard("modern"), hours: null, branches: [], schedule: undefined, address: undefined, extraInfo: undefined },
    }));
    expect(html).not.toContain("Horario");
    expect(html).not.toContain("Sucursales");
  });
});

describe("templates", () => {
  it("resuelve cada template y cae en Modern si es desconocido", () => {
    for (const t of TEMPLATES) expect(getTemplateComponent(t)).toBeTypeOf("function");
    expect(getTemplateComponent("inexistente")).toBe(ModernTemplate);
  });
});

describe("archivos", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  const enc = (s: string) => new TextEncoder().encode(s);
  it("N: logo inválido, formato incorrecto, grande o firma falsa", () => {
    expect(validateImage(png, "image/png").ok).toBe(true);
    expect(validateImage(new Uint8Array([1, 2, 3]), "image/png").ok).toBe(false);
    expect(validateImage(png, "application/pdf").ok).toBe(false);
    expect(validateImage(png, "text/html").ok).toBe(false);
    expect(validateImage(new Uint8Array(2 * 1024 * 1024 + 1), "image/png").ok).toBe(false);
    expect(validateImage(new Uint8Array(0), "image/png").ok).toBe(false);
  });
  it("SVG con scripts se rechaza", () => {
    expect(validateImage(enc("<svg><script>alert(1)</script></svg>"), "image/svg+xml").ok).toBe(false);
    expect(validateImage(enc('<svg onload="x()"></svg>'), "image/svg+xml").ok).toBe(false);
    expect(validateImage(enc('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'), "image/svg+xml").ok).toBe(true);
  });
  it("PDF solo en modo PDF y con firma válida", () => {
    expect(validateUpload(enc("%PDF-1.7 ..."), "application/pdf", true).ok).toBe(true);
    expect(validateUpload(enc("%PDF-1.7 ..."), "application/pdf", false).ok).toBe(false);
    expect(validateUpload(enc("no es pdf"), "application/pdf", true).ok).toBe(false);
    expect(validateUpload(png, "image/png", true).ok).toBe(false);
    expect(validateUpload(new Uint8Array(5 * 1024 * 1024 + 1), "application/pdf", true).ok).toBe(false);
  });
});

describe("color", () => {
  it("texto legible y contraste", () => {
    expect(readableOn("#ffffff")).toBe("#111111");
    expect(readableOn("#0b1220")).toBe("#ffffff");
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffff00", "#ffffff")).toBeLessThan(2); // amarillo sobre blanco
  });
});

describe("banner (portada)", () => {
  const html = (over: object) =>
    renderToStaticMarkup(createElement(DigitalCard, { data: { ...buildDemoCard("modern", "hero"), ...over } }));
  it("color sólido, degradado entre dos colores o imagen, con borde difuminado opcional", () => {
    expect(html({ coverMode: "color", coverFade: false })).not.toContain("linear-gradient(135deg");
    expect(html({ coverMode: "gradient", coverFade: false })).toContain("linear-gradient(135deg, var(--card-primary), var(--card-cover-2))");
    const img = html({ coverMode: "image", coverImageUrl: "/demo/barberia-cover.svg", coverFade: false });
    expect(img).toContain('src="/demo/barberia-cover.svg"');
    expect(html({ coverMode: "color", coverFade: true })).toContain("to bottom, transparent, var(--card-background)");
  });
  it("modo imagen sin imagen no rompe; filas antiguas sin cover_mode usan color", () => {
    expect(html({ coverMode: "image", coverImageUrl: undefined })).toContain("<h1");
    const data = rowToCardData({ slug: "x", business_name: "X" });
    expect(data.coverMode).toBe("color");
    expect(data.coverFade).toBe(false);
  });
  it("solo acepta imágenes http(s) o los assets propios /demo", () => {
    const base = valid();
    expect(cardInputSchema.safeParse({ ...base, coverImageUrl: "/demo/cafe-cover.svg" }).success).toBe(true);
    expect(cardInputSchema.safeParse({ ...base, coverImageUrl: "/etc/passwd" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...base, coverImageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(rowToCardData({ cover_image_url: "javascript:alert(1)" }).coverImageUrl).toBeUndefined();
  });
});
