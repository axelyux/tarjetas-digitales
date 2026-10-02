# Arquitectura

Una sola app Next.js (App Router) que renderiza todas las tarjetas desde datos en Supabase. No hay código por cliente.

```
Customer (cliente_name, texto)        ← hoy un campo; evolucionable a tabla
   └── Card (cards)                   ← 1 tarjeta = 1 URL = 1 QR
         ├── Contenido   nombre, descripción, dirección, horario semanal
         ├── Diseño      template, colores, fuente, estructura, logo, fondo
         ├── Acciones    card_actions[]  (tipo, etiqueta, destino, orden, visible)
         ├── Sucursales  card_branches[] (nombre, dirección, contacto, horario)
         ├── Publicación publication_status  draft | preview | active | inactive | archived
         ├── Pago        payment_status      pending | paid | cancelled   (independiente)
         └── Slugs       slug vigente + card_slug_aliases (URLs anteriores)
```

## Flujo de una visita

`/{slug}` → Server Component (ISR, `revalidate = 300`) → consulta con rol `anon` + RLS → `DigitalCard` → `getTemplateComponent` → HTML casi sin JS.
Cada mutación del panel llama a `revalidatePath` del slug vigente **y de todos sus aliases**, así que un cambio (o una desactivación) se ve de inmediato.

Resolución cuando no hay tarjeta activa (`resolve_card_slug`):
| Situación | Resultado |
| --- | --- |
| slug es alias de otra tarjeta | redirección 307 al slug vigente (los QR impresos siguen funcionando) |
| tarjeta inactiva / archivada | pantalla "no disponible" |
| borrador / vista previa / inexistente | 404 (no se revela que existe) |
| error de BD | pantalla de error amable (si había versión en caché, se sigue sirviendo) |

## Modelo de acciones (`card_actions`)

Un solo mecanismo para todo canal: `type` + `value` + `label` + `metadata` + `sort_order` + `enabled`.

Tipos: `whatsapp phone email instagram facebook maps website booking custom_url pdf youtube tiktok linkedin catalog`.

- `custom_url` cubre cualquier destino (menú, Mercado Libre, Calendly, Shopify, formulario...). No se crea código por servicio.
- Varios WhatsApp: simplemente varias acciones con etiqueta distinta ("Citas", "Ventas").
- El destino se guarda como lo escribió el cliente (normalizado) y se convierte en `href` al renderizar (`resolveActionHref`): `wa.me`, `tel:`, `mailto:`, URL `https`.
  Cualquier otro esquema (`javascript:`, `data:`, `vbscript:`, `file:`) se rechaza en el formulario, en el servidor (Zod), en la BD (`CHECK`) y de nuevo al renderizar.
- Una acción sin destino válido **no se renderiza**: nunca hay botones muertos ni secciones vacías.
- Redes (`instagram facebook youtube tiktok linkedin`) salen como fila de iconos; el resto como botones. La primera acción visible es el botón destacado.
- Cada enlace lleva `data-action-type` / `data-action-id` para añadir analítica de clics más adelante sin tocar la tarjeta.
- Los campos antiguos (`whatsapp`, `instagram_url`...) de la v1 siguen en la tabla `cards` como **deprecated**: la migración 0002 los copió a acciones y el público ya no puede leerlos.

## Estados

`publication_status` y `payment_status` son independientes (`PAID + INACTIVE`, `PENDING + PREVIEW`...).
`is_active` / `is_paid` se conservan como columnas derivadas por trigger (compatibilidad); la fuente de verdad son los estados.
Archivar es el camino normal; **eliminar solo se permite en tarjetas archivadas**.

## Vista previa privada

`/p/{token}`: token aleatorio de 244 bits por tarjeta (`preview_token`), RPC `get_card_preview` (security definer, sin datos administrativos), `noindex`, sin caché. Se puede regenerar para invalidar el enlace anterior. Funciona con la tarjeta en cualquier estado salvo archivada.

## Guardado atómico y concurrencia

`save_card(...)` (función Postgres, `security invoker`, valida `is_admin()`):
- guarda tarjeta + acciones + sucursales en **una transacción** (nunca queda una tarjeta a medias);
- `create` es **idempotente por `id`** (el cliente genera el UUID): doble clic o reintento tras perder la red no duplica;
- `update` usa **concurrencia optimista** (`updated_at` leído al abrir): si otra sesión cambió la tarjeta, el guardado se rechaza con un mensaje claro;
- cambiar el slug crea el alias del anterior y valida que nadie más lo use.

## Seguridad

- Autenticación: Supabase Auth; autorización: tabla `admins` + `is_admin()`. El `proxy.ts` solo bloquea la navegación a `/admin`; **cada layout, server action y policy RLS vuelve a verificar**.
- RLS: el público (`anon`) solo lee tarjetas `active` y **solo columnas de presentación** (sin pago, token, cliente ni campos legacy). Tablas hijas usan `card_is_public()` porque `anon` no puede leer `publication_status`.
- Validación en servidor con Zod (los mismos esquemas que el formulario) + restricciones `CHECK` en la BD. Contenido del cliente siempre como texto (React escapa); no hay `dangerouslySetInnerHTML`.
- Subidas: tipo declarado + firma real (magic bytes) + extensión + tamaño (imágenes 2 MB, PDF 5 MB) + SVG sin scripts; solo URLs del host de Supabase se aceptan como imagen.
- Sin `service role key` en ningún lugar. Límite de creación (20 tarjetas/min) contra abuso o bucles.
- Auditoría: `card_audit` (created, updated, published, unpublished, preview, duplicated, archived, deleted, payment_changed).
- Este panel es de **un solo administrador / equipo de confianza**: todo admin ve todas las tarjetas. Para multiusuario habría que agregar propietario por tarjeta y ajustar las policies.

## Imágenes y Storage

Bucket `card-assets/{cardId}/{tipo}-{timestamp}.{ext}`. El nombre cambia en cada subida, así que no hay caché obsoleta de logos reemplazados. El navegador reduce las imágenes a WEBP antes de subirlas (se conserva la transparencia). Al guardar se borran los archivos de la tarjeta que ya no se usan; al duplicar se copian a la carpeta de la nueva tarjeta; al eliminar se borra la carpeta.
Los logos horizontales/verticales se muestran completos (`object-contain`, usando `logo_ratio`); los cuadrados usan la forma elegida.

## Datos corruptos

`rowToCardData` sanea todo lo que viene de la BD: template, color, icono o tipo desconocidos usan valores por defecto; `sort_order` duplicado o nulo produce un orden estable; horarios inválidos se ignoran. Ninguno produce un 500.

## Evolución prevista (sin implementar)

- Cliente/negocio: promover `customer_name` a tabla `customers` / `businesses` con FK en `cards`.
- Analítica: registrar `page_view` y clics usando `data-action-type`.
- Dominios: `cardUrl()` y `NEXT_PUBLIC_SITE_URL` centralizan la URL; subdominios requieren un rewrite en `proxy.ts`.
- Pagos / WhatsApp API: `payment_status` ya es independiente de la publicación; la tarjeta no depende de ninguna integración.

## Pruebas

`npm test`: lógica (enlaces, esquemas, mapper, renderizado de los 6 templates con datos completos, vacíos, largos y corruptos) y **base de datos real** con PGlite (migraciones 0001+0002 sobre datos de la v1, RLS por rol, `save_card`, alias, concurrencia, idempotencia, seed).
