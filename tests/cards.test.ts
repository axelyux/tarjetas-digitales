import { describe, expect, it } from "vitest";
import { buildActions } from "@/lib/cards/actions-builder";
import { emptyCardInput } from "@/lib/cards/defaults";
import {
  isHttpUrl, normalizeFacebook, normalizeInstagram, normalizeWhatsapp, telLink, whatsappLink,
} from "@/lib/cards/links";
import { inputToCardData, inputToRow } from "@/lib/cards/mapper";
import { cardInputSchema } from "@/lib/cards/schema";
import { isReservedSlug, nextSlug, slugify } from "@/lib/cards/slug";
import { validateImage } from "@/lib/cards/upload-validation";
import { readableOn } from "@/lib/color";
import { buildDemoCard } from "@/lib/demo";
import { getTemplateComponent } from "@/components/templates";
import { ModernTemplate } from "@/components/templates/ModernTemplate";
import { TEMPLATES } from "@/lib/cards/constants";

const ID = "6f1d0b8e-7c1a-4a55-9d1c-0d3f4c2b9a11";
const valid = () => ({ ...emptyCardInput(ID), businessName: "Barbería Carlos", slug: "barberia-carlos" });

describe("slug", () => {
  it("normaliza acentos, espacios y mayúsculas", () => {
    expect(slugify("  Barbería  Carlos!! ")).toBe("barberia-carlos");
    expect(slugify("Taller Mecánico Juan")).toBe("taller-mecanico-juan");
  });
  it("genera sufijos incrementales", () => {
    expect(nextSlug("barberia-carlos")).toBe("barberia-carlos-2");
    expect(nextSlug("barberia-carlos-2")).toBe("barberia-carlos-3");
  });
  it("detecta slugs reservados", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("barberia-carlos")).toBe(false);
  });
});

describe("links", () => {
  it("normaliza WhatsApp mexicano", () => {
    expect(normalizeWhatsapp("55 1234 5678")).toBe("525512345678");
    expect(normalizeWhatsapp("+52 1 55 1234 5678")).toBe("525512345678");
    expect(whatsappLink("5512345678", "Hola mundo")).toBe("https://wa.me/525512345678?text=Hola%20mundo");
  });
  it("arma enlaces tel y redes", () => {
    expect(telLink("(55) 1234-5678")).toBe("tel:5512345678");
    expect(normalizeInstagram("@barberia")).toBe("https://instagram.com/barberia");
    expect(normalizeFacebook("https://facebook.com/x")).toBe("https://facebook.com/x");
  });
  it("rechaza URLs peligrosas", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,x")).toBe(false);
    expect(isHttpUrl("https://example.com")).toBe(true);
  });
});

describe("cardInputSchema", () => {
  it("acepta una tarjeta válida", () => {
    expect(cardInputSchema.safeParse(valid()).success).toBe(true);
  });
  it("exige nombre y slug", () => {
    const r = cardInputSchema.safeParse({ ...valid(), businessName: "", slug: "" });
    expect(r.success).toBe(false);
  });
  it("rechaza slugs inválidos y reservados", () => {
    for (const slug of ["Barberia Carlos", "-abc", "abc-", "a--b", "admin", "a"]) {
      expect(cardInputSchema.safeParse({ ...valid(), slug }).success, slug).toBe(false);
    }
  });
  it("rechaza URLs inválidas o con javascript:", () => {
    expect(cardInputSchema.safeParse({ ...valid(), bookingUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...valid(), googleMapsUrl: "no es url" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...valid(), websiteUrl: "https://ok.com" }).success).toBe(true);
  });
  it("valida colores, teléfonos y botones", () => {
    expect(cardInputSchema.safeParse({ ...valid(), primaryColor: "red" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...valid(), whatsapp: "abc" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...valid(), whatsapp: "12" }).success).toBe(false);
    const bad = { ...valid(), buttons: [{ label: "x", url: "javascript:1", icon: "link", isActive: true }] };
    expect(cardInputSchema.safeParse(bad).success).toBe(false);
  });
  it("rechaza ids que no son UUID", () => {
    expect(cardInputSchema.safeParse({ ...valid(), id: "1; drop table cards" }).success).toBe(false);
  });
  it("limita la cantidad de botones", () => {
    const button = { label: "b", url: "https://a.com", icon: "link" as const, isActive: true };
    expect(cardInputSchema.safeParse({ ...valid(), buttons: Array(9).fill(button) }).success).toBe(false);
  });
});

describe("mapper", () => {
  it("convierte vacíos a null y normaliza contactos para la BD", () => {
    const row = inputToRow({ ...valid(), whatsapp: "55 1234 5678", instagramUrl: "@carlos", description: "" });
    expect(row.whatsapp).toBe("525512345678");
    expect(row.instagram_url).toBe("https://instagram.com/carlos");
    expect(row.description).toBeNull();
    expect(row.facebook_url).toBeNull();
  });
  it("el preview ignora URLs inválidas", () => {
    const data = inputToCardData({ ...valid(), bookingUrl: "javascript:1", logoUrl: "no" });
    expect(data.bookingUrl).toBeUndefined();
    expect(data.logoUrl).toBeUndefined();
  });
});

describe("acciones de la tarjeta", () => {
  it("construye WhatsApp primero y separa redes", () => {
    const { main, social } = buildActions(buildDemoCard("modern"));
    expect(main[0]?.key).toBe("whatsapp");
    expect(main.map((a) => a.key)).toEqual(expect.arrayContaining(["booking", "phone", "maps"]));
    expect(social.map((a) => a.key)).toEqual(["instagram", "facebook"]);
    expect(main.at(-1)?.label).toBe("Promociones");
  });
  it("usa la dirección si no hay enlace de Maps", () => {
    const data = { ...buildDemoCard("modern"), googleMapsUrl: undefined };
    expect(buildActions(data).main.find((a) => a.key === "maps")?.href).toContain("google.com/maps/search");
  });
  it("omite lo que no existe", () => {
    const { main, social } = buildActions({ ...buildDemoCard("modern"), whatsapp: undefined, buttons: [] });
    expect(main.some((a) => a.key === "whatsapp")).toBe(false);
    expect(social).toHaveLength(2);
  });
});

describe("templates", () => {
  it("resuelve cada template y cae en Modern si es desconocido", () => {
    for (const t of TEMPLATES) expect(getTemplateComponent(t)).toBeTypeOf("function");
    expect(getTemplateComponent("inexistente")).toBe(ModernTemplate);
  });
});

describe("imágenes", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  it("acepta PNG válido y rechaza firma falsa", () => {
    expect(validateImage(png, "image/png").ok).toBe(true);
    expect(validateImage(new Uint8Array([1, 2, 3]), "image/png").ok).toBe(false);
  });
  it("rechaza tipos no permitidos y archivos grandes", () => {
    expect(validateImage(png, "application/pdf").ok).toBe(false);
    expect(validateImage(new Uint8Array(2 * 1024 * 1024 + 1), "image/png").ok).toBe(false);
  });
  it("rechaza SVG con scripts", () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(validateImage(enc("<svg><script>alert(1)</script></svg>"), "image/svg+xml").ok).toBe(false);
    expect(validateImage(enc('<svg onload="x()"></svg>'), "image/svg+xml").ok).toBe(false);
    expect(validateImage(enc('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'), "image/svg+xml").ok).toBe(true);
  });
});

describe("color", () => {
  it("elige texto legible", () => {
    expect(readableOn("#ffffff")).toBe("#111111");
    expect(readableOn("#0b1220")).toBe("#ffffff");
  });
});
