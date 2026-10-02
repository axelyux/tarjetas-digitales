// Prueba las migraciones SQL reales contra Postgres (PGlite en memoria) con roles anon/authenticated y RLS.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const sql = (f: string) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8");

const SUPABASE_STUBS = `
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  create schema auth; grant usage on schema auth to anon, authenticated;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant execute on function auth.jwt() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text);
  alter table storage.objects enable row level security;
`;

let db: PGlite;

async function as<T>(role: "anon" | "authenticated" | "postgres", email: string | null, fn: () => Promise<T>) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claims', '${email ? JSON.stringify({ email }) : ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

const q = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
  (await db.query<T>(text, params)).rows;

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const cardJson = (n: number, over: Record<string, unknown> = {}) => ({
  id: ID(n), slug: `card-${n}`, business_name: `Card ${n}`, description: null, category: null, address: null,
  schedule: null, extra_info: null, customer_name: null, logo_url: null, cover_image_url: null, cover_mode: "color", cover_color2: "#64748b", cover_fade: false, logo_ratio: 1,
  hours: null, primary_color: "#111111", secondary_color: "#eeeeee", background_color: "#ffffff",
  text_color: "#111111", accent_color: "#0d9488", template: "modern", layout_variant: "centered",
  actions_layout: "stack", border_radius: "md", button_style: "solid", card_style: "flat", shadow_style: "soft",
  logo_size: "md", logo_shape: "circle", font: "inter", background_mode: "color", background_image_url: null,
  background_overlay: 40, show_qr: true, publication_status: "active", payment_status: "pending", ...over,
});

const save = (mode: string, card: object, actions: object[] = [], branches: object[] = [], expected: string | null = null) =>
  as("authenticated", "admin@test.com", () =>
    q("select public.save_card($1,$2::jsonb,$3::jsonb,$4::jsonb,$5) as r", [
      mode, JSON.stringify(card), JSON.stringify(actions), JSON.stringify(branches), expected,
    ]),
  );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  await db.exec(sql("0001_init.sql"));
  await db.exec("insert into public.admins(email) values ('admin@test.com')");
  // Datos "legacy" creados con la version 1 antes de migrar:
  await db.exec(`
    insert into public.cards (id, slug, business_name, whatsapp, whatsapp_message, instagram_url, google_maps_url, address, is_active, is_paid)
    values ('${ID(900)}', 'legacy-activa', 'Legacy Activa', '525512345678', 'Hola', 'https://instagram.com/x', 'https://maps.google.com/?q=1', 'Calle 1', true, true),
           ('${ID(901)}', 'legacy-inactiva', 'Legacy Inactiva', null, null, null, null, null, false, false);
    insert into public.card_buttons (card_id, label, url, icon, position) values ('${ID(900)}', 'Menú', 'https://ex.com/menu', 'menu', 0);
  `);
  await db.exec(sql("0002_robustness.sql"));
  await db.exec(sql("0003_cover_style.sql"));
}, 60000);

describe("migración 0002 sobre datos existentes", () => {
  it("convierte is_active/is_paid en estados independientes", async () => {
    const rows = await q<{ slug: string; publication_status: string; payment_status: string }>(
      "select slug, publication_status, payment_status from public.cards where id in ($1,$2) order by slug", [ID(900), ID(901)]);
    expect(rows).toEqual([
      { slug: "legacy-activa", publication_status: "active", payment_status: "paid" },
      { slug: "legacy-inactiva", publication_status: "inactive", payment_status: "pending" },
    ]);
  });

  it("migra campos legacy a acciones ordenadas y conserva botones personalizados al final", async () => {
    const rows = await q<{ type: string; sort_order: number; value: string }>(
      "select type, sort_order, value from public.card_actions where card_id = $1 order by sort_order", [ID(900)]);
    expect(rows.map((r) => r.type)).toEqual(["whatsapp", "maps", "instagram", "custom_url"]);
    expect(rows.map((r) => Number(r.sort_order))).toEqual([0, 1, 2, 3]);
  });

  it("todas las tarjetas existentes reciben preview_token único", async () => {
    const rows = await q<{ n: string }>("select count(distinct preview_token) as n from public.cards");
    expect(Number(rows[0]?.n)).toBe(2);
  });
});

describe("save_card", () => {
  it("crea tarjeta con acciones y sucursales de forma atómica", async () => {
    const res = await save("create", cardJson(1),
      [{ type: "whatsapp", value: "525511111111", metadata: { message: "Hola" } },
       { type: "whatsapp", label: "Ventas", value: "525522222222" },
       { type: "custom_url", label: "Ver menú", value: "https://ex.com/menu", icon: "menu" }],
      [{ name: "Centro", address: "A" }, { name: "Madero", address: "B" }]);
    expect((res[0] as { r: { replayed: boolean } }).r.replayed).toBe(false);
    const acts = await q<{ type: string; label: string }>("select type,label from public.card_actions where card_id=$1 order by sort_order", [ID(1)]);
    expect(acts.map((a) => a.label)).toEqual(["", "Ventas", "Ver menú"]);
    expect((await q("select 1 from public.card_branches where card_id=$1", [ID(1)])).length).toBe(2);
  });

  it("es idempotente: el reintento/doble clic de creación no duplica", async () => {
    await save("create", cardJson(2));
    const again = await save("create", cardJson(2, { business_name: "Otro nombre" }));
    expect((again[0] as { r: { replayed: boolean } }).r.replayed).toBe(true);
    expect((await q("select 1 from public.cards where id=$1", [ID(2)])).length).toBe(1);
    expect((await q<{ business_name: string }>("select business_name from public.cards where id=$1", [ID(2)]))[0]?.business_name).toBe("Card 2");
  });

  it("rechaza slug duplicado (constraint de BD)", async () => {
    await save("create", cardJson(3));
    await expect(save("create", cardJson(4, { slug: "card-3" }))).rejects.toMatchObject({ code: "23505" });
  });

  it("rechaza acciones con esquemas peligrosos a nivel de BD", async () => {
    await expect(save("create", cardJson(5), [{ type: "custom_url", label: "x", value: "javascript:alert(1)" }])).rejects.toThrow();
    expect((await q("select 1 from public.cards where id=$1", [ID(5)])).length).toBe(0); // rollback total
  });

  it("detecta conflicto de edición concurrente", async () => {
    const created = await save("create", cardJson(6));
    const stamp = (created[0] as { r: { updated_at: string } }).r.updated_at;
    const first = await save("update", cardJson(6, { business_name: "Primero" }), [], [], stamp);
    expect((first[0] as { r: { updated_at: string } }).r.updated_at).not.toBe(stamp);
    await expect(save("update", cardJson(6, { business_name: "Segundo" }), [], [], stamp)).rejects.toThrow(/card_conflict/);
    expect((await q<{ business_name: string }>("select business_name from public.cards where id=$1", [ID(6)]))[0]?.business_name).toBe("Primero");
  });

  it("al cambiar el slug crea alias y resolve_card_slug redirige", async () => {
    await save("create", cardJson(7, { slug: "viejo-slug" }));
    await save("update", cardJson(7, { slug: "nuevo-slug" }));
    const r = await as("anon", null, () => q<{ s: string }>("select public.resolve_card_slug('viejo-slug') as s"));
    expect(r[0]?.s).toBe("redirect:nuevo-slug");
    // otra tarjeta no puede reutilizar un alias existente
    await expect(save("create", cardJson(8, { slug: "viejo-slug" }))).rejects.toThrow(/slug_taken/);
    // volver al slug original elimina el alias
    await save("update", cardJson(7, { slug: "viejo-slug" }));
    const back = await as("anon", null, () => q<{ s: string | null }>("select public.resolve_card_slug('viejo-slug') as s"));
    expect(back[0]?.s).toBeNull();
  });

  it("un no-admin no puede guardar", async () => {
    await expect(
      as("authenticated", "intruso@test.com", () =>
        q("select public.save_card('create',$1::jsonb,'[]','[]',null)", [JSON.stringify(cardJson(9))])),
    ).rejects.toThrow(/forbidden/);
  });
});

describe("RLS y acceso público", () => {
  it("anon solo ve tarjetas activas y no puede leer is_paid ni campos privados", async () => {
    await save("create", cardJson(10, { publication_status: "draft" }));
    await save("create", cardJson(11, { publication_status: "active", payment_status: "paid" }));
    const rows = await as("anon", null, () => q<{ slug: string }>("select slug from public.cards order by slug"));
    expect(rows.map((r) => r.slug)).toContain("card-11");
    expect(rows.map((r) => r.slug)).not.toContain("card-10");
    await expect(as("anon", null, () => q("select is_paid from public.cards"))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => q("select preview_token from public.cards"))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => q("select whatsapp from public.cards"))).rejects.toThrow(/permission denied/);
  });

  it("anon no puede escribir, ni leer aliases ni auditoría", async () => {
    await expect(as("anon", null, () => q("update public.cards set business_name='x'"))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => q("select * from public.card_audit"))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => q("select * from public.card_slug_aliases"))).rejects.toThrow(/permission denied/);
  });

  it("tarjetas inactivas/archivadas: 'unavailable'; draft: no se revela", async () => {
    await save("create", cardJson(12, { publication_status: "inactive" }));
    await save("create", cardJson(13, { publication_status: "archived" }));
    const res = await as("anon", null, () =>
      q<{ a: string | null; b: string | null; c: string | null; d: string | null }>(
        "select public.resolve_card_slug('card-12') a, public.resolve_card_slug('card-13') b, public.resolve_card_slug('card-10') c, public.resolve_card_slug('no-existe') d"));
    expect(res[0]).toEqual({ a: "unavailable", b: "unavailable", c: null, d: null });
  });

  it("acciones deshabilitadas no son públicas", async () => {
    await save("create", cardJson(14), [
      { type: "whatsapp", value: "5255", enabled: true }, { type: "instagram", value: "https://instagram.com/x", enabled: false }]);
    const rows = await as("anon", null, () =>
      q<{ type: string }>("select type from public.card_actions where card_id=$1", [ID(14)]));
    expect(rows.map((r) => r.type)).toEqual(["whatsapp"]);
  });
});

describe("preview privado", () => {
  it("devuelve la tarjeta draft por token, sin datos administrativos, y no por slug", async () => {
    const token = (await q<{ t: string }>("select preview_token t from public.cards where id=$1", [ID(10)]))[0]!.t;
    const res = await as("anon", null, () => q<{ p: Record<string, unknown> }>("select public.get_card_preview($1) p", [token]));
    const p = res[0]!.p;
    expect(p.slug).toBe("card-10");
    expect(p).not.toHaveProperty("is_paid");
    expect(p).not.toHaveProperty("payment_status");
    expect(p).not.toHaveProperty("preview_token");
    expect(Array.isArray(p.card_actions)).toBe(true);
    const bad = await as("anon", null, () => q<{ p: unknown }>("select public.get_card_preview('card-10') p"));
    expect(bad[0]?.p).toBeNull();
  });
});

describe("estados", () => {
  it("publicación y pago son independientes y is_active se deriva", async () => {
    await as("authenticated", "admin@test.com", () =>
      q("update public.cards set payment_status='paid', publication_status='inactive' where id=$1", [ID(11)]));
    const row = (await q<{ is_active: boolean; is_paid: boolean }>("select is_active,is_paid from public.cards where id=$1", [ID(11)]))[0];
    expect(row).toEqual({ is_active: false, is_paid: true });
    await as("authenticated", "admin@test.com", () =>
      q("update public.cards set publication_status='active' where id=$1", [ID(11)]));
    const again = (await q<{ is_active: boolean; payment_status: string }>("select is_active,payment_status from public.cards where id=$1", [ID(11)]))[0];
    expect(again).toEqual({ is_active: true, payment_status: "paid" });
  });

  it("registra auditoría de crear/actualizar", async () => {
    const rows = await as("authenticated", "admin@test.com", () =>
      q<{ action: string }>("select action from public.card_audit where card_id=$1 order by id", [ID(6)]));
    expect(rows.map((r) => r.action)).toEqual(["created", "updated"]);
  });
});
