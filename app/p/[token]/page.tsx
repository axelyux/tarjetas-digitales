import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardUnavailable } from "@/components/card/CardUnavailable";
import { DigitalCard } from "@/components/card/DigitalCard";
import { getPreviewCard } from "@/lib/cards/public-queries";
import { qrDataUriFor } from "@/lib/qr";

// Vista previa privada: nunca se cachea ni se indexa. Solo accesible con el token secreto.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vista previa | Tarjeta Digital",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getPreviewCard(token);
  if (result.status === "missing") notFound();
  if (result.status === "error") return <CardUnavailable kind="error" />;

  const qrSrc = result.card.showQr ? await qrDataUriFor(result.card.slug) : undefined;
  return (
    <>
      <div role="status" className="sticky top-0 z-20 bg-ink px-4 py-2 text-center text-xs font-medium text-white">
        Vista previa privada. Esta tarjeta puede no estar publicada todavía.
      </div>
      <DigitalCard data={result.card} qrSrc={qrSrc} />
    </>
  );
}
