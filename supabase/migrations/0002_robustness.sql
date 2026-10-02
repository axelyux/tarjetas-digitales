-- Robustez: acciones flexibles, estados separados, sucursales, aliases de slug, preview privado, auditoria.
-- NO destructiva: agrega, renombra y migra datos existentes. Los campos legacy de cards se conservan (deprecated).

-- ───────── 1. Estados de publicacion y de pago (independientes) ─────────
alter table public.cards add column publication_status text not null default 'draft'
  check (publication_status in ('draft','preview','active','inactive','archived'));
alter table public.cards add column payment_status text not null default 'pending'
  check (payment_status in ('pending','paid','cancelled'));

update public.cards set
  publication_status = case when is_active then 'active' else 'inactive' end,
  payment_status = case when is_paid then 'paid' else 'pending' end;

-- ───────── 2. Campos nuevos de tarjeta ─────────
alter table public.cards add column customer_name text check (char_length(customer_name) <= 80);
alter table public.cards add column logo_ratio numeric(6,3) not null default 1 check (logo_ratio > 0 and logo_ratio < 20);
alter table public.cards add column hours jsonb;
alter table public.cards add column preview_token text unique
  default (replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));
update public.cards set preview_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  where preview_token is null;
alter table public.cards alter column preview_token set not null;

create index if not exists cards_status_idx on public.cards (publication_status, created_at desc);
create index if not exists cards_customer_idx on public.cards (lower(customer_name));

-- is_active / is_paid quedan como columnas derivadas (compatibilidad); la fuente de verdad son los estados.
create or replace function public.touch_card()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.is_active = (new.publication_status = 'active');
  new.is_paid = (new.payment_status = 'paid');
  if new.is_active and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

-- ───────── 3. card_buttons -> card_actions (acciones flexibles) ─────────
alter table public.card_buttons rename to card_actions;
alter table public.card_actions rename column url to value;
alter table public.card_actions rename column position to sort_order;
alter table public.card_actions rename column is_active to enabled;
alter index public.card_buttons_card_idx rename to card_actions_card_idx;

alter table public.card_actions drop constraint card_buttons_label_check;
alter table public.card_actions drop constraint card_buttons_url_check;
alter table public.card_actions alter column label set default '';
alter table public.card_actions add constraint card_actions_label_len check (char_length(label) <= 30);
alter table public.card_actions add constraint card_actions_value_len check (char_length(value) between 1 and 500);
alter table public.card_actions add constraint card_actions_value_scheme
  check (value !~* '^\s*(javascript|data|vbscript|file):');
alter table public.card_actions add column type text not null default 'custom_url'
  check (type in ('whatsapp','phone','email','instagram','facebook','maps','website','booking',
                  'custom_url','pdf','youtube','tiktok','linkedin','catalog'));
alter table public.card_actions add column metadata jsonb not null default '{}'::jsonb;

-- Backfill: campos legacy -> acciones (orden estandar), luego los botones personalizados existentes.
update public.card_actions set sort_order = sort_order + 100;

insert into public.card_actions (card_id, type, label, value, icon, metadata, sort_order)
select id, 'whatsapp', '', whatsapp, 'link',
       case when whatsapp_message is not null then jsonb_build_object('message', whatsapp_message) else '{}'::jsonb end, 0
  from public.cards where whatsapp is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'booking', '', booking_url, 'link', 1 from public.cards where booking_url is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'phone', '', phone, 'link', 2 from public.cards where phone is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'maps', '', coalesce(google_maps_url, address), 'link', 3
  from public.cards where coalesce(google_maps_url, address) is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'website', '', website_url, 'link', 4 from public.cards where website_url is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'instagram', '', instagram_url, 'link', 5 from public.cards where instagram_url is not null;
insert into public.card_actions (card_id, type, label, value, icon, sort_order)
select id, 'facebook', '', facebook_url, 'link', 6 from public.cards where facebook_url is not null;

update public.card_actions a set sort_order = r.rn
  from (select id, (row_number() over (partition by card_id order by sort_order, id) - 1)::smallint as rn
          from public.card_actions) r
 where a.id = r.id;

-- ───────── 4. Sucursales ─────────
create table public.card_branches (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  address text check (char_length(address) <= 200),
  maps_url text check (char_length(maps_url) <= 500 and maps_url !~* '^\s*(javascript|data|vbscript|file):'),
  phone text check (char_length(phone) <= 30),
  whatsapp text check (char_length(whatsapp) <= 30),
  hours jsonb,
  enabled boolean not null default true,
  sort_order smallint not null default 0
);
create index card_branches_card_idx on public.card_branches (card_id, sort_order);

-- ───────── 5. Aliases de slug (QR impresos siguen funcionando) ─────────
create table public.card_slug_aliases (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  card_id uuid not null references public.cards(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index card_slug_aliases_card_idx on public.card_slug_aliases (card_id);

-- ───────── 6. Auditoria ─────────
create table public.card_audit (
  id bigint generated always as identity primary key,
  card_id uuid,
  action text not null,
  actor text not null default coalesce(auth.jwt() ->> 'email', ''),
  details jsonb,
  created_at timestamptz not null default now()
);
create index card_audit_card_idx on public.card_audit (card_id, created_at desc);

-- ───────── 7. RLS y permisos ─────────
alter table public.card_branches enable row level security;
alter table public.card_slug_aliases enable row level security;
alter table public.card_audit enable row level security;

-- Las policies de tablas hijas no pueden leer columnas de cards que anon no tiene; se usa una funcion definer.
create or replace function public.card_is_public(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.cards where id = p_id and publication_status = 'active');
$$;
grant execute on function public.card_is_public(uuid) to anon, authenticated;

drop policy if exists cards_public_read on public.cards;
create policy cards_public_read on public.cards
  for select to anon, authenticated using (publication_status = 'active');

drop policy if exists buttons_public_read on public.card_actions;
create policy actions_public_read on public.card_actions
  for select to anon, authenticated
  using (enabled and public.card_is_public(card_id));
drop policy if exists buttons_admin_all on public.card_actions;
create policy actions_admin_all on public.card_actions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy branches_public_read on public.card_branches
  for select to anon, authenticated
  using (enabled and public.card_is_public(card_id));
create policy branches_admin_all on public.card_branches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy aliases_admin_all on public.card_slug_aliases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy audit_admin_read on public.card_audit
  for select to authenticated using (public.is_admin());
create policy audit_admin_insert on public.card_audit
  for insert to authenticated with check (public.is_admin());

-- El publico (anon) solo lee columnas de presentacion. Los campos legacy dejan de ser publicos.
revoke all on public.cards from anon;
revoke all on public.card_actions from anon;
revoke all on public.card_branches from anon;
revoke all on public.card_slug_aliases from anon;
revoke all on public.card_audit from anon;
grant select (
  id, slug, business_name, description, category, address, schedule, extra_info,
  logo_url, cover_image_url, logo_ratio, hours,
  primary_color, secondary_color, background_color, text_color, accent_color,
  template, layout_variant, actions_layout, border_radius, button_style, card_style,
  shadow_style, logo_size, logo_shape, font, background_mode, background_image_url,
  background_overlay, show_qr, published_at, updated_at
) on public.cards to anon;
grant select (id, card_id, type, label, value, icon, metadata, sort_order, enabled) on public.card_actions to anon;
grant select (id, card_id, name, address, maps_url, phone, whatsapp, hours, enabled, sort_order) on public.card_branches to anon;

grant select, insert, update, delete on public.card_actions, public.card_branches, public.card_slug_aliases to authenticated;
grant select, insert on public.card_audit to authenticated;

-- ───────── 8. Resolucion de slug (alias -> redirect, inactiva -> no disponible) ─────────
drop function if exists public.card_is_inactive(text);
create or replace function public.resolve_card_slug(p_slug text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case when publication_status in ('inactive','archived') then 'unavailable' end
       from public.cards where slug = p_slug),
    (select 'redirect:' || c.slug
       from public.card_slug_aliases a join public.cards c on c.id = a.card_id
      where a.slug = p_slug and c.publication_status in ('active','inactive','archived'))
  );
$$;
grant execute on function public.resolve_card_slug(text) to anon, authenticated;

-- ───────── 9. Preview privado por token ─────────
create or replace function public.get_card_preview(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (to_jsonb(c) - array['is_paid','is_active','payment_status','publication_status','preview_token',
                              'customer_name','created_at','phone','whatsapp','whatsapp_message','instagram_url',
                              'facebook_url','google_maps_url','website_url','booking_url']::text[])
         || jsonb_build_object(
              'card_actions', (select coalesce(jsonb_agg(to_jsonb(a) order by a.sort_order), '[]'::jsonb)
                                 from public.card_actions a where a.card_id = c.id and a.enabled),
              'card_branches', (select coalesce(jsonb_agg(to_jsonb(b) order by b.sort_order), '[]'::jsonb)
                                  from public.card_branches b where b.card_id = c.id and b.enabled))
    from public.cards c
   where length(p_token) >= 32 and c.preview_token = p_token and c.publication_status <> 'archived'
   limit 1;
$$;
grant execute on function public.get_card_preview(text) to anon, authenticated;

-- ───────── 10. Guardado atomico (tarjeta + acciones + sucursales) ─────────
-- p_mode = 'create': idempotente (si el id ya existe devuelve el existente: reintentos/doble clic).
-- p_mode = 'update': control de concurrencia optimista con p_expected (updated_at leido por el editor).
create or replace function public.save_card(
  p_mode text, p_card jsonb, p_actions jsonb, p_branches jsonb, p_expected text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  cols constant text[] := array[
    'slug','business_name','description','category','address','schedule','extra_info','customer_name',
    'logo_url','cover_image_url','logo_ratio','hours',
    'primary_color','secondary_color','background_color','text_color','accent_color',
    'template','layout_variant','actions_layout','border_radius','button_style','card_style','shadow_style',
    'logo_size','logo_shape','font','background_mode','background_image_url','background_overlay','show_qr',
    'publication_status','payment_status'];
  col_list text := (select string_agg(quote_ident(c), ',') from unnest(cols) c);
  r public.cards;
  existing public.cards;
  result public.cards;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_mode not in ('create', 'update') then
    raise exception 'invalid_mode' using errcode = 'P0001';
  end if;

  r := jsonb_populate_record(null::public.cards, p_card);
  select * into existing from public.cards where id = r.id for update;

  if p_mode = 'create' then
    if existing.id is not null then
      return jsonb_build_object('id', existing.id, 'slug', existing.slug,
                                'updated_at', existing.updated_at, 'replayed', true);
    end if;
    if exists (select 1 from public.card_slug_aliases where slug = r.slug) then
      raise exception 'slug_taken' using errcode = 'P0001';
    end if;
    execute format(
      'insert into public.cards (id, %1$s) select id, %1$s from jsonb_populate_record(null::public.cards, $1)',
      col_list) using p_card;
  else
    if existing.id is null then
      raise exception 'card_missing' using errcode = 'P0001';
    end if;
    if p_expected is not null and existing.updated_at <> p_expected::timestamptz then
      raise exception 'card_conflict' using errcode = 'P0001';
    end if;
    if existing.slug <> r.slug then
      if exists (select 1 from public.card_slug_aliases where slug = r.slug and card_id <> r.id) then
        raise exception 'slug_taken' using errcode = 'P0001';
      end if;
      delete from public.card_slug_aliases where slug = r.slug;
      insert into public.card_slug_aliases (slug, card_id) values (existing.slug, r.id) on conflict do nothing;
    end if;
    execute format(
      'update public.cards set (%1$s) = (select %1$s from jsonb_populate_record(null::public.cards, $1)) where id = $2',
      col_list) using p_card, r.id;
  end if;

  delete from public.card_actions where card_id = r.id;
  insert into public.card_actions (card_id, type, label, value, icon, metadata, enabled, sort_order)
  select r.id, a.type, coalesce(a.label, ''), a.value, coalesce(a.icon, 'link'),
         coalesce(a.metadata, '{}'::jsonb), coalesce(a.enabled, true), (e.ord - 1)::smallint
    from jsonb_array_elements(coalesce(p_actions, '[]'::jsonb)) with ordinality as e(elem, ord),
         lateral jsonb_populate_record(null::public.card_actions, e.elem) a;

  delete from public.card_branches where card_id = r.id;
  insert into public.card_branches (card_id, name, address, maps_url, phone, whatsapp, hours, enabled, sort_order)
  select r.id, b.name, b.address, b.maps_url, b.phone, b.whatsapp, b.hours, coalesce(b.enabled, true), (e.ord - 1)::smallint
    from jsonb_array_elements(coalesce(p_branches, '[]'::jsonb)) with ordinality as e(elem, ord),
         lateral jsonb_populate_record(null::public.card_branches, e.elem) b;

  select * into result from public.cards where id = r.id;
  insert into public.card_audit (card_id, action, details)
  values (r.id, case when p_mode = 'create' then 'created' else 'updated' end,
          jsonb_build_object('slug', result.slug, 'publication_status', result.publication_status));

  return jsonb_build_object('id', result.id, 'slug', result.slug, 'updated_at', result.updated_at, 'replayed', false);
end;
$$;
grant execute on function public.save_card(text, jsonb, jsonb, jsonb, text) to authenticated;

-- ───────── 11. Storage: tambien PDF (hasta 5 MB) ─────────
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf']
 where id = 'card-assets';
