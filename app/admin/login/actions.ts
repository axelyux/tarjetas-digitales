"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/clients";

export type SignInState = { error: string | null };

const credentials = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Revisa tu correo y contraseña" };

  const supabase = await createAdminClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Credenciales incorrectas" };

  if (!(await getAdminSession())) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel" };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createAdminClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
