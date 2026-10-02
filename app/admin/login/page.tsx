import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/clients";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Acceso | Tarjetas Digitales", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7">
        <h1 className="text-xl font-semibold tracking-tight">Panel de tarjetas</h1>
        <p className="mt-1 text-sm text-muted">Acceso exclusivo para administración.</p>
        {hasSupabaseEnv() ? (
          <LoginForm />
        ) : (
          <p role="alert" className="mt-6 rounded-lg bg-[#fdf3e2] p-3 text-sm text-warn">
            Faltan las variables de Supabase. Copia .env.example a .env.local y completa NEXT_PUBLIC_SUPABASE_URL y
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        )}
      </div>
    </main>
  );
}
