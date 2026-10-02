import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Protege /admin: refresca la sesión de Supabase y redirige al login si no hay usuario.
 *  La autorización real (tabla admins + RLS) se vuelve a verificar en cada layout y server action. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
