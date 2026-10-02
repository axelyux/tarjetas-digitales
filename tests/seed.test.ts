// Verifica que seed.sql es válido contra el esquema real y re-ejecutable, y que los casos demo cubren lo esperado.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { PUBLIC_ACTION_COLUMNS, PUBLIC_BRANCH_COLUMNS, PUBLIC_COLUMNS } from "@/lib/cards/mapper";

const read = (path: string) => readFileSync(new URL(`../supabase/${path}`, import.meta.url), "utf8");

const STUBS = `
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
beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUBS);
  await db.exec(read("migrations/0001_init.sql"));
  await db.exec(read("migrations/0002_robustness.sql"));
  await db.exec(read("migrations/0003_cover_style.sql"));
  await db.exec(read("seed.sql"));
  await db.exec(read("seed.sql")); // re-ejecutable
}, 60000);

describe("seed.sql", () => {
  it("crea las 3 tarjetas demo una sola vez (re-ejecutable)", async () => {
    const r = await db.query<{ n: string }>("select count(*) n from public.cards");
    expect(Number(r.rows[0]?.n)).toBe(3);
    const a = await db.query<{ n: string }>("select count(*) n from public.card_actions");
    expect(Number(a.rows[0]?.n)).toBe(24);
    const b = await db.query<{ n: string }>("select count(*) n from public.card_branches");
    expect(Number(b.rows[0]?.n)).toBe(4);
  });

  it("cada negocio tiene logo, banner con imagen real y estados distintos", async () => {
    const r = await db.query<{ slug: string; logo_url: string; cover_image_url: string; cover_mode: string; payment_status: string }>(
      "select slug, logo_url, cover_image_url, cover_mode, payment_status from public.cards order by slug");
    expect(r.rows.map((x) => x.slug)).toEqual(["barberia-don-ramiro", "cafe-tostado", "iron-forge-gym"]);
    for (const row of r.rows) {
      expect(row.logo_url).toMatch(/^\/demo\/.+-logo\.svg$/);
      expect(row.cover_image_url).toMatch(/^\/demo\/.+-cover\.jpg$/);
      expect(row.cover_mode).toBe("image");
    }
    expect(r.rows.find((x) => x.slug === "iron-forge-gym")?.payment_status).toBe("pending");
  });

  it("los archivos de imagen referenciados existen en /public/demo", async () => {
    const { existsSync } = await import("node:fs");
    const r = await db.query<{ logo_url: string; cover_image_url: string }>("select logo_url, cover_image_url from public.cards");
    for (const row of r.rows) {
      for (const url of [row.logo_url, row.cover_image_url]) {
        expect(existsSync(new URL(`../public${url}`, import.meta.url)), url).toBe(true);
      }
    }
  });

  it("incluye varias acciones del mismo tipo, PDF, enlace personalizado y sucursales", async () => {
    const types = await db.query<{ type: string }>("select distinct type from public.card_actions order by type");
    expect(types.rows.map((t) => t.type)).toEqual(
      expect.arrayContaining(["whatsapp", "phone", "booking", "maps", "pdf", "custom_url", "email", "instagram", "facebook", "tiktok", "youtube"]));
    const br = await db.query("select 1 from public.card_branches b join public.cards c on c.id = b.card_id where c.slug = 'cafe-tostado'");
    expect(br.rows).toHaveLength(2);
  });

  it("el público ve las 3 tarjetas activas", async () => {
    await db.exec("set role anon");
    try {
      const r = await db.query<{ slug: string }>("select slug from public.cards order by slug");
      expect(r.rows).toHaveLength(3);
    } finally {
      await db.exec("reset role");
    }
  });

  it("las consultas EXACTAS de la página pública funcionan con el rol anon (columnas concedidas)", async () => {
    await db.exec("set role anon");
    try {
      const card = await db.query<{ id: string }>(`select ${PUBLIC_COLUMNS} from public.cards where slug = 'iron-forge-gym'`);
      expect(card.rows).toHaveLength(1);
      const acts = await db.query(`select ${PUBLIC_ACTION_COLUMNS} from public.card_actions where card_id = $1`, [card.rows[0]!.id]);
      expect(acts.rows).toHaveLength(8);
      const branches = await db.query(`select ${PUBLIC_BRANCH_COLUMNS} from public.card_branches`);
      expect(branches.rows).toHaveLength(4);
      const sm = await db.query("select slug,updated_at from public.cards order by updated_at desc limit 5000");
      expect(sm.rows).toHaveLength(3);
      await expect(db.query("select slug from public.cards where publication_status = 'active'")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
});
