type Props = {
  /** URL de la imagen del QR (data URI en la pagina publica, /api/qr/slug en el preview). */
  src?: string;
  businessName: string;
  className?: string;
};

export function CardQr({ src, businessName, className = "" }: Props) {
  if (!src) return null;
  return (
    <figure className={`flex flex-col items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG generado en servidor */}
      <img
        src={src}
        alt={`Código QR de la tarjeta de ${businessName}`}
        width={132}
        height={132}
        loading="lazy"
        className="rounded-lg bg-white p-2"
      />
      <figcaption className="cd-muted text-xs">Escanea para compartir esta tarjeta</figcaption>
    </figure>
  );
}
