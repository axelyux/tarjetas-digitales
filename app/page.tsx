import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-5 text-center">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">Tarjetas Digitales</h1>
        <p className="text-pretty text-sm text-muted">
          Cada negocio tiene su propia dirección. Escribe el enlace de una tarjeta para verla.
        </p>
        <Link href="/demo" className="btn">
          Ver demostración
        </Link>
      </div>
    </main>
  );
}
