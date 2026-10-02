import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardUnavailable } from "@/components/card/CardUnavailable";
import { DigitalCard } from "@/components/card/DigitalCard";
import { getPublicCard } from "@/lib/cards/public-queries";
import { qrDataUriFor } from "@/lib/qr";
import { cardUrl } from "@/lib/site";

// ISR: la tarjeta se sirve cacheada y se invalida al instante desde el admin (revalidatePath).
// 300 s es solo la red de seguridad si algún cambio se hiciera fuera del panel.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

// Sin prerender en build: cada slug se genera bajo demanda y queda cacheado (ISR).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicCard(slug);
  if (result.status !== "active") return { title: "Tarjeta Digital", robots: { index: false, follow: false } };

  const { card } = result;
  const title = `${card.businessName} | Tarjeta Digital`;
  const description = card.description ?? `${card.businessName}${card.category ? ` · ${card.category}` : ""}. Contacto, ubicación y redes.`;
  const image = card.coverImageUrl ?? card.logoUrl;
  const url = cardUrl(card.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    // El ícono de la pestaña es el logo del negocio (si no tiene, se usa el ícono por defecto).
    ...(card.logoUrl ? { icons: { icon: card.logoUrl, apple: card.logoUrl } } : {}),
    openGraph: { title, description, url, type: "website", locale: "es_MX", siteName: card.businessName, images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublicCard(slug);

  if (result.status === "missing") notFound();
  if (result.status === "error") throw new Error("card-unavailable");
  if (result.status === "inactive") return <CardUnavailable kind="inactive" />;
  // Slug anterior (QR impresos): redirección temporal al slug vigente.
  if (result.status === "redirect") redirect(`/${result.slug}`);

  const qrSrc = result.card.showQr ? await qrDataUriFor(result.card.slug) : undefined;
  return <DigitalCard data={result.card} qrSrc={qrSrc} />;
}
