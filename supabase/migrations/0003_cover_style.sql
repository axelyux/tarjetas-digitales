-- Banner configurable: color sólido, degradado entre dos colores o imagen; con borde inferior difuminado opcional.
-- NO destructiva.

alter table public.cards add column cover_mode text not null default 'color'
  check (cover_mode in ('color','gradient','image'));
alter table public.cards add column cover_color2 text not null default '#64748b'
  check (cover_color2 ~ '^#[0-9a-fA-F]{6}$');
alter table public.cards add column cover_fade boolean not null default false;

-- Las tarjetas que ya tenían imagen de portada siguen mostrándola.
update public.cards set cover_mode = 'image' where cover_image_url is not null;

grant select (cover_mode, cover_color2, cover_fade) on public.cards to anon;

-- Guardado atomico: misma funcion que 0002 con las columnas nuevas del banner.
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
    'publication_status','payment_status','cover_mode','cover_color2','cover_fade'];
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

