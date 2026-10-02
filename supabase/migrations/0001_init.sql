-- Tarjetas Digitales: esquema inicial
-- Ejecutar en Supabase > SQL Editor (o con `supabase db push`).


-- ───────── Admins ─────────
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
-- Sin policies: nadie la lee desde la API. Solo la usa is_admin() (security definer).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ───────── Cards ─────────
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  business_name text not null check (char_length(business_name) between 2 and 80),
  description text check (char_length(description) <= 400),
  category text check (char_length(category) <= 40),
  address text check (char_length(address) <= 200),
  schedule text check (char_length(schedule) <= 300),
  extra_info text check (char_length(extra_info) <= 600),

  logo_url text,
  cover_image_url text,

  phone text,
  whatsapp text,
  whatsapp_message text check (char_length(whatsapp_message) <= 200),
  instagram_url text,
  facebook_url text,
  google_maps_url text,
  website_url text,
  booking_url text,

  primary_color text not null default '#111827' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#f3f4f6' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  background_color text not null default '#ffffff' check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  text_color text not null default '#111827' check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text not null default '#0d9488' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),

  template text not null default 'modern'
    check (template in ('minimal','modern','elegant','bold','soft','editorial')),
  layout_variant text not null default 'centered'
    check (layout_variant in ('centered','left','hero','compact')),
  actions_layout text not null default 'stack' check (actions_layout in ('stack','grid')),
  border_radius text not null default 'md' check (border_radius in ('none','sm','md','lg','full')),
  button_style text not null default 'solid' check (button_style in ('solid','outline','soft')),
  card_style text not null default 'flat' check (card_style in ('flat','bordered','raised')),
  shadow_style text not null default 'soft' check (shadow_style in ('none','soft','strong')),
  logo_size text not null default 'md' check (logo_size in ('sm','md','lg')),
  logo_shape text not null default 'circle' check (logo_shape in ('circle','rounded','square')),
  font text not null default 'inter'
    check (font in ('inter','poppins','playfair','space-grotesk','dm-sans')),
  background_mode text not null default 'color' check (background_mode in ('color','image')),
  background_image_url text,
  background_overlay smallint not null default 40 check (background_overlay between 0 and 90),
  show_qr boolean not null default true,

  is_active boolean not null default true,
  is_paid boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_created_at_idx on public.cards (created_at desc);
create index if not exists cards_business_name_idx on public.cards (lower(business_name));

create table if not exists public.card_buttons (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 30),
  url text not null check (url ~* '^https?://' and char_length(url) <= 500),
  icon text not null default 'link',
  position smallint not null default 0,
  is_active boolean not null default true
);
create index if not exists card_buttons_card_idx on public.card_buttons (card_id, position);

create or replace function public.touch_card()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.is_active and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists cards_touch on public.cards;
create trigger cards_touch before insert or update on public.cards
  for each row execute function public.touch_card();

-- ───────── Existencia de tarjeta inactiva (para mostrar "no disponible" en vez de 404) ─────────
create or replace function public.card_is_inactive(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.cards where slug = p_slug and is_active = false);
$$;
grant execute on function public.card_is_inactive(text) to anon, authenticated;

-- ───────── RLS ─────────
alter table public.cards enable row level security;
alter table public.card_buttons enable row level security;

drop policy if exists cards_public_read on public.cards;
create policy cards_public_read on public.cards
  for select to anon, authenticated using (is_active);

drop policy if exists cards_admin_all on public.cards;
create policy cards_admin_all on public.cards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists buttons_public_read on public.card_buttons;
create policy buttons_public_read on public.card_buttons
  for select to anon, authenticated
  using (is_active and exists (select 1 from public.cards c where c.id = card_id and c.is_active));

drop policy if exists buttons_admin_all on public.card_buttons;
create policy buttons_admin_all on public.card_buttons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El publico (anon) NO puede leer columnas administrativas (is_paid, etc.).
revoke all on public.cards from anon;
revoke all on public.card_buttons from anon;
grant select (
  id, slug, business_name, description, category, address, schedule, extra_info,
  logo_url, cover_image_url, phone, whatsapp, whatsapp_message, instagram_url, facebook_url,
  google_maps_url, website_url, booking_url,
  primary_color, secondary_color, background_color, text_color, accent_color,
  template, layout_variant, actions_layout, border_radius, button_style, card_style,
  shadow_style, logo_size, logo_shape, font, background_mode, background_image_url,
  background_overlay, show_qr, is_active, published_at, updated_at
) on public.cards to anon;
grant select (id, card_id, label, url, icon, position, is_active) on public.card_buttons to anon;

grant select, insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.card_buttons to authenticated;

-- ───────── Storage ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-assets', 'card-assets', true, 2097152,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml'];

-- Lectura publica via URL publica del bucket; escritura solo admin.
drop policy if exists card_assets_admin_insert on storage.objects;
create policy card_assets_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'card-assets' and public.is_admin());

drop policy if exists card_assets_admin_update on storage.objects;
create policy card_assets_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'card-assets' and public.is_admin())
  with check (bucket_id = 'card-assets' and public.is_admin());

drop policy if exists card_assets_admin_delete on storage.objects;
create policy card_assets_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'card-assets' and public.is_admin());

drop policy if exists card_assets_admin_select on storage.objects;
create policy card_assets_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'card-assets' and public.is_admin());
