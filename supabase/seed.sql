-- Datos demo. Ejecutar despues de 0001_init.sql (SQL Editor, rol postgres).
-- Reemplaza TU_EMAIL por el correo del administrador creado en Authentication > Users.
insert into public.admins (email) values (lower('TU_EMAIL@ejemplo.com')) on conflict do nothing;

insert into public.cards (
  slug, business_name, description, category, address, schedule,
  phone, whatsapp, instagram_url, facebook_url, google_maps_url, booking_url,
  primary_color, secondary_color, background_color, text_color, accent_color,
  template, layout_variant, actions_layout, border_radius, button_style, font,
  is_active, is_paid
) values
('barberia-carlos', 'Barbería Carlos', 'Cortes clásicos, fade y barba con navaja. Atención con cita o sin ella.', 'Barbería',
 'Av. Juárez 120, Centro', 'Lun a Sáb 10:00 - 20:00',
 '5512345678', '525512345678', 'https://instagram.com/barberiacarlos', 'https://facebook.com/barberiacarlos',
 'https://maps.google.com/?q=Av+Juarez+120', 'https://calendly.com/barberiacarlos',
 '#111827', '#f3f4f6', '#ffffff', '#111827', '#b45309',
 'modern', 'hero', 'stack', 'md', 'solid', 'inter', true, true),
('salon-maria', 'Salón María', 'Corte, color y tratamientos. Uñas acrílicas y manicura.', 'Salón de belleza',
 'Calle Hidalgo 45, Col. Centro', 'Mar a Dom 9:00 - 19:00',
 '5598765432', '525598765432', 'https://instagram.com/salonmaria', 'https://facebook.com/salonmaria',
 'https://maps.google.com/?q=Hidalgo+45', null,
 '#9d174d', '#fdf2f8', '#fff7fb', '#4a044e', '#db2777',
 'soft', 'centered', 'grid', 'full', 'soft', 'poppins', true, false),
('taller-juan', 'Taller Mecánico Juan', 'Afinación, frenos, suspensión y diagnóstico por computadora.', 'Taller mecánico',
 'Blvd. Industrial 800', 'Lun a Vie 8:00 - 18:00, Sáb 8:00 - 14:00',
 '5544332211', '525544332211', null, 'https://facebook.com/tallerjuan',
 'https://maps.google.com/?q=Blvd+Industrial+800', null,
 '#111111', '#fde047', '#fafafa', '#111111', '#facc15',
 'bold', 'left', 'stack', 'none', 'solid', 'space-grotesk', true, true),
('cafe-central', 'Café Central', 'Café de especialidad, desayunos y repostería artesanal.', 'Cafetería',
 'Plaza Mayor 3', 'Todos los días 7:00 - 21:00',
 '5577889900', '525577889900', 'https://instagram.com/cafecentral', null,
 'https://maps.google.com/?q=Plaza+Mayor+3', null,
 '#3f2a1d', '#efe6dc', '#faf6f1', '#2b1d14', '#a16207',
 'editorial', 'centered', 'stack', 'sm', 'outline', 'playfair', true, false)
on conflict (slug) do nothing;

insert into public.card_buttons (card_id, label, url, icon, position)
select id, 'Menú', 'https://example.com/menu', 'menu', 0 from public.cards c where slug = 'cafe-central'
  and not exists (select 1 from public.card_buttons b where b.card_id = c.id);
insert into public.card_buttons (card_id, label, url, icon, position)
select id, 'Promociones', 'https://example.com/promos', 'tag', 0 from public.cards c where slug = 'barberia-carlos'
  and not exists (select 1 from public.card_buttons b where b.card_id = c.id);
