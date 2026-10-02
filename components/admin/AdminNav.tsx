"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Panel", exact: true },
  { href: "/admin/cards", label: "Tarjetas", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex gap-1">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-paper text-ink" : "text-muted hover:text-ink"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
