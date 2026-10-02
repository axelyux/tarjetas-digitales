-- Datos de prueba: 3 negocios de ejemplo con imágenes reales (fotos libres de Unsplash en /public/demo).
-- Los nombres, teléfonos y redes son FICTICIOS (teléfonos 55 5555 01xx, redes con sufijo _demo, dominios example.com).
-- Re-ejecutable: no duplica nada. Requiere las migraciones 0001, 0002 y 0003.
--
-- 1) Correo del administrador (el mismo de Authentication > Users).
insert into public.admins (email) values (lower('axelyahelfigueroa55@gmail.com')) on conflict do nothing;

insert into public.cards (
  slug, business_name, customer_name, description, category, address, extra_info, hours,
  logo_url, cover_image_url, cover_mode, cover_color2, cover_fade,
  primary_color, secondary_color, background_color, text_color, accent_color,
  template, layout_variant, actions_layout, border_radius, button_style, shadow_style, logo_shape, font,
  publication_status, payment_status
) values
-- 1) Barbería (Guadalajara)
('barberia-don-ramiro', 'Barbería Don Ramiro', 'Ramiro Ochoa',
 'Corte clásico, fade, barba con toalla caliente y afeitado a navaja. Desde 2012 en el centro de Guadalajara.',
 'Barbería', 'Av. Juárez 410, Col. Centro, Guadalajara, Jal.', 'Primer corte con 15% de descuento. Aceptamos tarjeta.',
 '{"mon":{"closed":false,"open":"10:00","close":"20:00"},"tue":{"closed":false,"open":"10:00","close":"20:00"},"wed":{"closed":false,"open":"10:00","close":"20:00"},"thu":{"closed":false,"open":"10:00","close":"20:00"},"fri":{"closed":false,"open":"10:00","close":"21:00"},"sat":{"closed":false,"open":"09:00","close":"21:00"},"sun":{"closed":false,"open":"10:00","close":"15:00"}}',
 '/demo/barberia-don-ramiro-logo.svg', '/demo/barberia-don-ramiro-cover.jpg', 'image', '#b45309', true,
 '#1b1b1b', '#f4efe8', '#fbf8f3', '#1b1b1b', '#b45309',
 'modern', 'hero', 'stack', 'md', 'solid', 'soft', 'circle', 'inter',
 'active', 'paid'),
-- 2) Cafetería de especialidad (CDMX) con dos sucursales
('cafe-tostado', 'Tostado Café de Especialidad', 'Grupo Tostado',
 'Café de origen mexicano tostado cada semana, desayunos todo el día y repostería artesanal.',
 'Cafetería', null, 'Pet friendly. Wi-Fi gratis. Leche vegetal sin costo extra.',
 '{"mon":{"closed":false,"open":"07:00","close":"21:00"},"tue":{"closed":false,"open":"07:00","close":"21:00"},"wed":{"closed":false,"open":"07:00","close":"21:00"},"thu":{"closed":false,"open":"07:00","close":"21:00"},"fri":{"closed":false,"open":"07:00","close":"22:00"},"sat":{"closed":false,"open":"08:00","close":"22:00"},"sun":{"closed":false,"open":"08:00","close":"20:00"}}',
 '/demo/cafe-tostado-logo.svg', '/demo/cafe-tostado-cover.jpg', 'image', '#a16207', false,
 '#3f2a1d', '#efe6dc', '#faf6f1', '#2b1d14', '#a16207',
 'editorial', 'hero', 'stack', 'sm', 'outline', 'none', 'square', 'playfair',
 'active', 'paid'),
-- 3) Gimnasio (Monterrey) con dos sucursales; pago pendiente
('iron-forge-gym', 'Iron Forge Gym', 'Iron Forge S.A. de C.V.',
 'Entrenamiento de fuerza, funcional y clases grupales. Entrenadores certificados y equipo de competencia.',
 'Gimnasio', 'Av. Gonzalitos 1250, Col. Mitras Norte, Monterrey, N.L.', 'Primera clase de prueba gratis. Regaderas y casilleros incluidos.',
 '{"mon":{"closed":false,"open":"05:30","close":"22:00"},"tue":{"closed":false,"open":"05:30","close":"22:00"},"wed":{"closed":false,"open":"05:30","close":"22:00"},"thu":{"closed":false,"open":"05:30","close":"22:00"},"fri":{"closed":false,"open":"05:30","close":"21:00"},"sat":{"closed":false,"open":"07:00","close":"18:00"},"sun":{"closed":false,"open":"08:00","close":"14:00"}}',
 '/demo/iron-forge-gym-logo.svg', '/demo/iron-forge-gym-cover.jpg', 'image', '#f97316', true,
 '#2a2a2a', '#171717', '#0a0a0a', '#fafafa', '#f97316',
 'bold', 'hero', 'stack', 'none', 'solid', 'strong', 'square', 'space-grotesk',
 'active', 'pending')
on conflict (slug) do nothing;

-- Botones (solo si la tarjeta aún no tiene ninguno)
with c as (select id, slug from public.cards where slug in ('barberia-don-ramiro','cafe-tostado','iron-forge-gym')
  and not exists (select 1 from public.card_actions a where a.card_id = cards.id))
insert into public.card_actions (card_id, type, label, value, icon, metadata, sort_order)
select c.id, v.type, v.label, v.value, v.icon, v.metadata::jsonb, v.ord
from c join (values
  -- Barbería Don Ramiro
  ('barberia-don-ramiro','whatsapp','Agendar por WhatsApp','523355550142','link','{"message":"Hola Don Ramiro, quiero agendar una cita"}',0),
  ('barberia-don-ramiro','phone','','3355550143','link','{}',1),
  ('barberia-don-ramiro','booking','Reservar en línea','https://example.com/reservar/don-ramiro','link','{}',2),
  ('barberia-don-ramiro','maps','','Av. Juárez 410, Col. Centro, Guadalajara, Jal.','link','{}',3),
  ('barberia-don-ramiro','pdf','Lista de precios','https://example.com/don-ramiro/precios.pdf','link','{}',4),
  ('barberia-don-ramiro','instagram','','@barberiadonramiro_demo','link','{}',5),
  ('barberia-don-ramiro','facebook','','barberiadonramiro.demo','link','{}',6),
  ('barberia-don-ramiro','tiktok','','@donramiro_demo','link','{}',7),
  -- Tostado Café
  ('cafe-tostado','whatsapp','Pedidos por WhatsApp','525555550171','link','{"message":"Hola, quiero hacer un pedido para recoger"}',0),
  ('cafe-tostado','custom_url','Ver menú','https://example.com/tostado/menu','menu','{}',1),
  ('cafe-tostado','pdf','Menú en PDF','https://example.com/tostado/menu.pdf','link','{}',2),
  ('cafe-tostado','custom_url','Comprar café en grano','https://example.com/tostado/tienda','shopping-bag','{}',3),
  ('cafe-tostado','email','','hola@tostado-demo.example.com','link','{}',4),
  ('cafe-tostado','instagram','','@tostadocafe_demo','link','{}',5),
  ('cafe-tostado','tiktok','','@tostadocafe_demo','link','{}',6),
  ('cafe-tostado','facebook','','tostadocafe.demo','link','{}',7),
  -- Iron Forge Gym
  ('iron-forge-gym','whatsapp','Inscríbete por WhatsApp','528155550188','link','{"message":"Hola, quiero información de inscripción y planes"}',0),
  ('iron-forge-gym','booking','Clase de prueba gratis','https://example.com/ironforge/clase-gratis','calendar','{}',1),
  ('iron-forge-gym','custom_url','Ver planes y precios','https://example.com/ironforge/planes','tag','{}',2),
  ('iron-forge-gym','phone','','8155550189','link','{}',3),
  ('iron-forge-gym','maps','','Av. Gonzalitos 1250, Col. Mitras Norte, Monterrey, N.L.','link','{}',4),
  ('iron-forge-gym','instagram','','@ironforgegym_demo','link','{}',5),
  ('iron-forge-gym','tiktok','','@ironforgegym_demo','link','{}',6),
  ('iron-forge-gym','youtube','','https://youtube.com/@ironforgegym_demo','link','{}',7)
) as v(slug, type, label, value, icon, metadata, ord) on v.slug = c.slug;

-- Sucursales (Tostado Café e Iron Forge Gym)
insert into public.card_branches (card_id, name, address, maps_url, phone, whatsapp, hours, sort_order)
select c.id, b.name, b.address, b.maps, b.phone, b.wa, b.hours::jsonb, b.ord
from public.cards c join (values
  ('cafe-tostado','Roma Norte','Calle Colima 142, Col. Roma Norte, CDMX','https://maps.google.com/?q=Calle+Colima+142+Roma+Norte+CDMX','5555550171','525555550171', null, 0),
  ('cafe-tostado','Coyoacán','Calle Francisco Sosa 88, Col. Del Carmen, Coyoacán, CDMX','https://maps.google.com/?q=Francisco+Sosa+88+Coyoacan','5555550172',null,
    '{"mon":{"closed":false,"open":"08:00","close":"20:00"},"tue":{"closed":false,"open":"08:00","close":"20:00"},"wed":{"closed":false,"open":"08:00","close":"20:00"},"thu":{"closed":false,"open":"08:00","close":"20:00"},"fri":{"closed":false,"open":"08:00","close":"21:00"},"sat":{"closed":false,"open":"08:00","close":"21:00"},"sun":{"closed":true,"open":"","close":""}}', 1),
  ('iron-forge-gym','Sucursal Mitras','Av. Gonzalitos 1250, Col. Mitras Norte, Monterrey, N.L.','https://maps.google.com/?q=Av+Gonzalitos+1250+Monterrey','8155550189','528155550188', null, 0),
  ('iron-forge-gym','Sucursal San Pedro','Calzada del Valle 340, San Pedro Garza García, N.L.','https://maps.google.com/?q=Calzada+del+Valle+340+San+Pedro','8155550190',null,
    '{"mon":{"closed":false,"open":"06:00","close":"22:00"},"tue":{"closed":false,"open":"06:00","close":"22:00"},"wed":{"closed":false,"open":"06:00","close":"22:00"},"thu":{"closed":false,"open":"06:00","close":"22:00"},"fri":{"closed":false,"open":"06:00","close":"21:00"},"sat":{"closed":false,"open":"08:00","close":"16:00"},"sun":{"closed":true,"open":"","close":""}}', 1)
) as b(slug, name, address, maps, phone, wa, hours, ord) on b.slug = c.slug
where not exists (select 1 from public.card_branches x where x.card_id = c.id);
