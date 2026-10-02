import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardInfo } from "@/components/card/CardInfo";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

/** Soft: tarjeta flotante redondeada sobre fondo tintado, paneles suaves. */
export function SoftTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  const hasInfo = Boolean(data.address || data.schedule || data.extraInfo);
  return (
    <>
      <main className="flex flex-1 flex-col px-3 pb-2 pt-4">
        <div className="flex-1 overflow-hidden rounded-[28px] bg-[var(--card-secondary)] pb-6 shadow-[var(--card-shadow)]">
          <CardHeader data={data} nameClassName="font-semibold" />
          <div className="flex flex-col gap-5 px-5 pt-7">
            <CardActions actions={main} data={data} />
            <CardSocialLinks links={social} className="justify-center" />
            {hasInfo ? (
              <div className="rounded-3xl bg-[var(--card-background)] p-5">
                <CardInfo data={data} />
              </div>
            ) : null}
            {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} /> : null}
          </div>
        </div>
      </main>
      <CardFooter />
    </>
  );
}
