"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const initial: SignInState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Correo
        <input name="email" type="email" autoComplete="email" required className="field" aria-invalid={state.error ? true : undefined} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className="field" aria-invalid={state.error ? true : undefined} />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
