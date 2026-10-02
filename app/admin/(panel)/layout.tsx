import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../login/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Panel | Tarjetas Digitales", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/admin" className="text-[0.95rem] font-semibold tracking-tight">
            Tarjetas
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:block">{session.email}</span>
            <form action={signOut}>
              <button type="submit" className="btn btn-sm" aria-label="Cerrar sesión">
                <LogOut size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
      <Toaster position="bottom-right" toastOptions={{ className: "text-sm" }} />
    </div>
  );
}
