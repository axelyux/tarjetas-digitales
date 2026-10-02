import type { Metadata } from "next";
import Link from "next/link";
import { DigitalCard } from "@/components/card/DigitalCard";
import { TEMPLATES, TEMPLATE_LABELS } from "@/lib/cards/constants";
import { buildDemoCard, parseDemoParams } from "@/lib/demo";
import { qrDataUriFor } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Demo | Tarjeta Digital",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ template?: string; layout?: string }> };

export default async function DemoPage({ searchParams }: Props) {
  const { template, layout } = parseDemoParams(await searchParams);
  const card = buildDemoCard(template, layout);
  const qrSrc = await qrDataUriFor(card.slug);

  return (
    <>
      <DigitalCard data={card} qrSrc={qrSrc} />
      <nav
        aria-label="Cambiar template de demostración"
        className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <ul className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface/95 p-1 text-xs shadow-lg">
          {TEMPLATES.map((t) => (
            <li key={t}>
              <Link
                href={`/demo?template=${t}&layout=${layout}`}
                aria-current={t === template ? "page" : undefined}
                className={`block rounded-full px-3 py-1.5 font-medium ${t === template ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              >
                {TEMPLATE_LABELS[t]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
