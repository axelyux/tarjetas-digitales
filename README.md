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
2. SQL Editor: ejecuta [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) (tablas, RLS, bucket `card-assets`).
3. Authentication > Users > Add user: crea tu usuario (correo + contraseña). Authentication > Sign In / Providers: desactiva "Allow new users to sign up".
4. SQL Editor: ejecuta [supabase/seed.sql](supabase/seed.sql) cambiando `TU_EMAIL@ejemplo.com` por tu correo. Esto te da acceso de administrador y carga 4 tarjetas demo. (Para solo dar acceso: `insert into admins(email) values ('tu@correo.com');`)

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

## Notas de arquitectura

- Tarjeta pública: Server Component con ISR (`revalidate = 300`) + `revalidatePath` inmediato al editar/activar/desactivar.
- Tarjeta inactiva: pantalla "no disponible" (no 404); inexistente: 404. El público (rol `anon`) no puede leer `is_paid`.
- Templates: `components/templates/*`, resueltos por `getTemplateComponent`. Colores vía variables CSS `--card-*`.
- QR: se genera al vuelo (`/api/qr/{slug}?format=svg|png&download=1`), nada se almacena.
- Imágenes: se reducen en el navegador a WEBP y se suben a `card-assets/{cardId}/`.
- Duplicar crea la copia como inactiva y pendiente para no publicar un clon por accidente.
