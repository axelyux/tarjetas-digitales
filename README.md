# Tarjetas Digitales

Plataforma interna para crear y administrar tarjetas digitales interactivas para negocios locales.
Una sola app Next.js (App Router) + Supabase (Postgres, Auth, Storage). Cada tarjeta vive en `/{slug}`.

## Instalación

```bash
npm install
cp .env.example .env.local   # completa los valores
```

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API > anon public key |
| `NEXT_PUBLIC_SITE_URL` | URL pública base (QR, canonical, sitemap). Local: `http://localhost:3000` |

No se usa `service role key`: el panel escribe con la sesión del administrador y RLS.

## Supabase (una sola vez)

1. Crea un proyecto en supabase.com.
2. SQL Editor: ejecuta en orden [0001_init.sql](supabase/migrations/0001_init.sql) y [0002_robustness.sql](supabase/migrations/0002_robustness.sql) (tablas, acciones, estados, sucursales, RLS, bucket `card-assets`). Si ya tenías datos de la v1, la 0002 los migra sin perder nada.
3. Authentication > Users > Add user: crea tu usuario (correo + contraseña). Authentication > Sign In / Providers: desactiva "Allow new users to sign up".
4. SQL Editor: ejecuta [supabase/seed.sql](supabase/seed.sql) cambiando `TU_EMAIL@ejemplo.com` por tu correo. Esto te da acceso de administrador y carga 6 tarjetas demo (completa, sin Instagram, con sucursales, PDF, inactiva, en vista previa...). Es re-ejecutable. (Para solo dar acceso: `insert into admins(email) values ('tu@correo.com');`)

## Desarrollo

```bash
npm run dev        # http://localhost:3000  (/demo funciona sin base de datos)
npm run lint
npm test
npm run build
```

Panel: `/admin` (login con el usuario del paso 3).

## Deploy en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel (framework: Next.js, sin cambios).
2. Agrega las 3 variables de entorno (`NEXT_PUBLIC_SITE_URL` = URL de producción, p. ej. `https://tu-proyecto.vercel.app`).
3. Deploy. Al cambiar de dominio, solo actualiza `NEXT_PUBLIC_SITE_URL` y redeploy.

## Qué puede configurar el administrador (sin tocar código)

- Hasta 20 botones reordenables: WhatsApp (varios, con mensaje inicial), teléfono, correo, Instagram, Facebook, TikTok, YouTube, LinkedIn, Maps, sitio, agenda, catálogo, **PDF** (se sube o se enlaza) y **enlace personalizado** para cualquier destino.
- Botones/redes opcionales: lo que no se llena no aparece. Se pueden ocultar sin borrarlos.
- Sucursales, horario semanal (con turno partido), logo (cuadrado, horizontal o vertical), colores, template, fuente.
- Estados: Borrador, Vista previa (enlace privado), Activa, Inactiva, Archivada; pago Pendiente / Pagada / Cancelada.
- Cambiar el slug conserva la URL anterior (redirección), por lo que los QR impresos siguen funcionando.
- QR descargable en PNG (1024 px) y SVG (vectorial, para imprenta).

## Solución de problemas

- *`/admin` vuelve al login*: tu correo debe existir en la tabla `admins` (paso 4).
- *“Esta tarjeta cambió en otra sesión”*: alguien (o tú en otra pestaña) la modificó; recarga y reaplica el cambio.
- *Una tarjeta nueva da 404*: si quedó como Borrador o Vista previa no es pública; actívala o usa su enlace de vista previa.
- *Login con muchos intentos fallidos*: Supabase Auth aplica su propio límite de intentos.
- *No sube el PDF/imagen*: ejecuta la migración 0002 (amplía el bucket a 5 MB y permite PDF).

Más detalle técnico: [ARCHITECTURE.md](ARCHITECTURE.md).

## Notas de arquitectura

- Tarjeta pública: Server Component con ISR (`revalidate = 300`) + `revalidatePath` inmediato al editar/activar/desactivar.
- Tarjeta inactiva: pantalla "no disponible" (no 404); inexistente o borrador: 404. El público (rol `anon`) no puede leer datos de pago ni internos.
- Templates: `components/templates/*`, resueltos por `getTemplateComponent`. Colores vía variables CSS `--card-*`.
- QR: se genera al vuelo (`/api/qr/{slug}?format=svg|png&download=1`), nada se almacena.
- Imágenes: se reducen en el navegador a WEBP y se suben a `card-assets/{cardId}/`.
- Duplicar crea la copia como borrador y con pago pendiente (copia también las imágenes) para no publicar un clon por accidente.

