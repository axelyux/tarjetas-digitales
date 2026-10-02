import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/clients";

export type AdminSession = { email: string };

/** Devuelve la sesion solo si el usuario autenticado esta en la tabla admins. */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createAdminClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true ? { email } : null;
}

/** Para paginas/layouts del panel: redirige al login si no hay admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
