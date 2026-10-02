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
  it("crea las tarjetas demo una sola vez", async () => {
    const r = await db.query<{ n: string }>("select count(*) n from public.cards");
    expect(Number(r.rows[0]?.n)).toBe(6);
    const a = await db.query<{ n: string }>("select count(*) n from public.card_actions");
    expect(Number(a.rows[0]?.n)).toBe(23);
    const b = await db.query<{ n: string }>("select count(*) n from public.card_branches");
    expect(Number(b.rows[0]?.n)).toBe(2);
  });

  it("cubre estados: activas, inactiva pagada y preview pendiente", async () => {
    const r = await db.query<{ slug: string; publication_status: string; payment_status: string }>(
      "select slug, publication_status, payment_status from public.cards order by slug");
    const by = Object.fromEntries(r.rows.map((x) => [x.slug, `${x.publication_status}+${x.payment_status}`]));
    expect(by["dental-sonrisa"]).toBe("inactive+paid");
    expect(by["estudio-luz"]).toBe("preview+pending");
    expect(by["salon-maria"]).toBe("active+pending");
  });

  it("incluye caso sin Instagram, sin logo y con varias acciones", async () => {
    const noIg = await db.query("select 1 from public.card_actions a join public.cards c on c.id = a.card_id where c.slug = 'taller-juan' and a.type = 'instagram'");
    expect(noIg.rows).toHaveLength(0);
    const noLogo = await db.query("select 1 from public.cards where logo_url is null");
    expect(noLogo.rows.length).toBeGreaterThanOrEqual(2); // dental y estudio sin logo
    const withLogo = await db.query("select cover_mode from public.cards where logo_url is not null order by slug");
    expect(withLogo.rows).toHaveLength(4);
    const gradient = await db.query("select 1 from public.cards where slug = 'salon-maria' and cover_mode = 'gradient' and cover_fade");
    expect(gradient.rows).toHaveLength(1);
    const wa = await db.query("select 1 from public.card_actions a join public.cards c on c.id = a.card_id where c.slug = 'barberia-carlos' and a.type = 'whatsapp'");
    expect(wa.rows).toHaveLength(2);
  });

  it("el público solo ve las tarjetas activas", async () => {
    await db.exec("set role anon");
    try {
      const r = await db.query<{ slug: string }>("select slug from public.cards order by slug");
      expect(r.rows.map((x) => x.slug)).toEqual(["barberia-carlos", "cafe-central", "salon-maria", "taller-juan"]);
    } finally {
      await db.exec("reset role");
    }
  });

  it("las consultas EXACTAS de la página pública funcionan con el rol anon (columnas concedidas)", async () => {
    await db.exec("set role anon");
    try {
      const card = await db.query<{ slug: string }>(`select ${PUBLIC_COLUMNS} from public.cards where slug = 'barberia-carlos'`);
      expect(card.rows).toHaveLength(1);
      const acts = await db.query(`select ${PUBLIC_ACTION_COLUMNS} from public.card_actions where card_id = $1`, [(card.rows[0] as unknown as { id: string }).id]);
      expect(acts.rows.length).toBeGreaterThan(3);
      await db.query(`select ${PUBLIC_BRANCH_COLUMNS} from public.card_branches`);
      const status = await db.query("select public.resolve_card_slug('dental-sonrisa') r");
      expect((status.rows[0] as { r: string }).r).toBe("unavailable");
      // anon NO puede filtrar por columnas privadas
      await expect(db.query("select slug from public.cards where publication_status = 'active'")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
});
