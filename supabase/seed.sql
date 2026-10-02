-- Datos demo. Ejecutar despues de las migraciones (SQL Editor, rol postgres). Es re-ejecutable.
-- 1) Reemplaza TU_EMAIL por el correo del administrador creado en Authentication > Users.
insert into public.admins (email) values (lower('TU_EMAIL@ejemplo.com')) on conflict do nothing;

-- 2) Tarjetas de ejemplo que cubren los casos reales:
--    completa, sin Instagram, sin logo, varias acciones/WhatsApp, URL personalizada, PDF, sucursales,
--    inactiva (pagada) y en vista previa (pago pendiente).
insert into public.cards (
  slug, business_name, customer_name, description, category, address, extra_info, hours,
  primary_color, secondary_color, background_color, text_color, accent_color,
  template, layout_variant, actions_layout, border_radius, button_style, font,
  publication_status, payment_status
) values
('barberia-carlos', 'Barbería Carlos', 'Carlos Pérez', 'Cortes clásicos, fade y barba con navaja. Con cita o sin ella.', 'Barbería',
 'Av. Juárez 120, Centro', 'Estacionamiento gratuito para clientes.',
 '{"mon":{"closed":false,"open":"10:00","close":"20:00"},"tue":{"closed":false,"open":"10:00","close":"20:00"},"wed":{"closed":false,"open":"10:00","close":"20:00"},"thu":{"closed":false,"open":"10:00","close":"20:00"},"fri":{"closed":false,"open":"10:00","close":"20:00"},"sat":{"closed":false,"open":"10:00","close":"14:00"},"sun":{"closed":true,"open":"","close":""}}',
 '#111827', '#f3f4f6', '#ffffff', '#111827', '#b45309',
 'modern', 'hero', 'stack', 'md', 'solid', 'inter', 'active', 'paid'),
('salon-maria', 'Salón María', 'María López', 'Corte, color y tratamientos. Uñas acrílicas y manicura.', 'Salón de belleza',
 'Calle Hidalgo 45, Col. Centro', null, null,
 '#9d174d', '#fdf2f8', '#fff7fb', '#4a044e', '#db2777',
 'soft', 'centered', 'grid', 'full', 'soft', 'poppins', 'active', 'pending'),
('taller-juan', 'Taller Mecánico Juan', 'Juan Ramírez', 'Afinación, frenos, suspensión y diagnóstico por computadora.', 'Taller mecánico',
 'Blvd. Industrial 800', null, null,
 '#111111', '#fde047', '#fafafa', '#111111', '#facc15',
 'bold', 'left', 'stack', 'none', 'solid', 'space-grotesk', 'active', 'paid'),
('cafe-central', 'Café Central', 'Grupo Central', 'Café de especialidad, desayunos y repostería artesanal.', 'Cafetería',
 null, null, null,
 '#3f2a1d', '#efe6dc', '#faf6f1', '#2b1d14', '#a16207',
 'editorial', 'centered', 'stack', 'sm', 'outline', 'playfair', 'active', 'paid'),
('dental-sonrisa', 'Dental Sonrisa', 'Dra. Ana Torres', 'Consultorio dental: limpieza, ortodoncia y blanqueamiento.', 'Dentista',
 'Av. Hidalgo 300', null, null,
 '#0f766e', '#f0fdfa', '#ffffff', '#134e4a', '#0d9488',
 'minimal', 'compact', 'stack', 'sm', 'outline', 'dm-sans', 'inactive', 'paid'),
('estudio-luz', 'Estudio Luz Fotografía', 'Luz Martínez', 'Sesiones, eventos y retratos.', 'Fotografía',
 null, null, null,
 '#1c1917', '#f5f0e6', '#faf7f0', '#1c1917', '#a8812f',
 'elegant', 'centered', 'stack', 'none', 'outline', 'playfair', 'preview', 'pending')
on conflict (slug) do nothing;

-- Acciones (se insertan solo si la tarjeta aún no tiene ninguna: re-ejecutable)
with c as (select id, slug from public.cards where slug in
  ('barberia-carlos','salon-maria','taller-juan','cafe-central','dental-sonrisa','estudio-luz')
  and not exists (select 1 from public.card_actions a where a.card_id = cards.id))
insert into public.card_actions (card_id, type, label, value, icon, metadata, sort_order)
select c.id, v.type, v.label, v.value, v.icon, v.metadata::jsonb, v.ord
from c join (values
  ('barberia-carlos','whatsapp','WhatsApp citas','525512345678','link','{"message":"Hola, quiero agendar una cita"}',0),
  ('barberia-carlos','whatsapp','WhatsApp ventas','525598765432','link','{}',1),
  ('barberia-carlos','booking','','https://calendly.com/barberiacarlos','link','{}',2),
  ('barberia-carlos','maps','','https://maps.google.com/?q=Av+Juarez+120','link','{}',3),
  ('barberia-carlos','custom_url','Promociones','https://example.com/promos','tag','{}',4),
  ('barberia-carlos','instagram','','https://instagram.com/barberiacarlos','link','{}',5),
  ('barberia-carlos','facebook','','https://facebook.com/barberiacarlos','link','{}',6),
  ('salon-maria','whatsapp','','525598765432','link','{}',0),
  ('salon-maria','phone','','5598765432','link','{}',1),
  ('salon-maria','instagram','','https://instagram.com/salonmaria','link','{}',2),
  ('salon-maria','facebook','','https://facebook.com/salonmaria','link','{}',3),
  ('salon-maria','maps','','Calle Hidalgo 45, Col. Centro','link','{}',4),
  ('taller-juan','whatsapp','','525544332211','link','{}',0),
  ('taller-juan','maps','','https://maps.google.com/?q=Blvd+Industrial+800','link','{}',1),
  ('taller-juan','facebook','','https://facebook.com/tallerjuan','link','{}',2),
  ('cafe-central','custom_url','Ver menú','https://example.com/menu','menu','{}',0),
  ('cafe-central','pdf','Menú en PDF','https://example.com/menu.pdf','link','{}',1),
  ('cafe-central','custom_url','Pedir en línea','https://www.mercadolibre.com.mx/','shopping-bag','{}',2),
  ('cafe-central','instagram','','https://instagram.com/cafecentral','link','{}',3),
  ('dental-sonrisa','whatsapp','','525511223344','link','{}',0),
  ('dental-sonrisa','email','','contacto@dentalsonrisa.example','link','{}',1),
  ('estudio-luz','whatsapp','','525566778899','link','{}',0),
  ('estudio-luz','custom_url','Ver portafolio','https://example.com/portafolio','camera','{}',1)
) as v(slug, type, label, value, icon, metadata, ord) on v.slug = c.slug;

-- Sucursales de Café Central
insert into public.card_branches (card_id, name, address, maps_url, phone, sort_order)
select id, b.name, b.address, b.maps, b.phone, b.ord from public.cards,
  (values ('Sucursal Centro','Plaza Mayor 3','https://maps.google.com/?q=Plaza+Mayor+3','5577889900',0),
          ('Sucursal Madero','Calle Madero 45','https://maps.google.com/?q=Madero+45','5577889911',1)) as b(name, address, maps, phone, ord)
where slug = 'cafe-central'
  and not exists (select 1 from public.card_branches x where x.card_id = cards.id);
