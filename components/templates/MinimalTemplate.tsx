import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardInfo } from "@/components/card/CardInfo";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

/** Minimal: tipografía sobria, filas separadas por líneas finas, sin adornos. */
export function MinimalTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  return (
    <>
      <main className="flex-1">
        <CardHeader data={data} nameClassName="tracking-tight" />
        <div className="flex flex-col gap-8 px-5 pb-6 pt-8">
          <CardActions actions={main} data={data} presentation="rows" />
          <CardInfo data={data} variant="plain" />
          <CardSocialLinks links={social} variant="text" className="gap-5" />
          {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} className="items-start" /> : null}
        </div>
      </main>
      <CardFooter />
    </>
  );
}
