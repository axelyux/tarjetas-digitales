import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, key };
}

/** Cliente anonimo sin sesion ni cookies: apto para paginas publicas cacheables. */
export function createPublicClient() {
  const { url, key } = requireEnv();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cliente con la sesion del administrador (cookies). Solo servidor. */
export async function createAdminClient() {
  const { url, key } = requireEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el proxy ya refresca la sesion.
        }
      },
    },
  });
}
