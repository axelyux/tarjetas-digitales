import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardInfo } from "@/components/card/CardInfo";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

/** Editorial: titular grande, acciones numeradas tipo índice, datos en columnas. */
export function EditorialTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  const hasInfo = Boolean(data.address || data.schedule || data.extraInfo);
  return (
    <>
      <main className="flex-1">
        <CardHeader
          data={data}
          nameClassName="text-[2.35rem] font-bold leading-[1.02] tracking-tight"
          descriptionClassName="text-base"
        />
        <div className="flex flex-col gap-9 px-5 pb-6 pt-8">
          <CardActions actions={main} data={data} presentation="numbered" />
          {hasInfo ? <CardInfo data={data} variant="plain" /> : null}
          <div className="flex items-end justify-between gap-4">
            <CardSocialLinks links={social} variant="text" className="gap-5" />
            {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} className="items-end text-right" /> : null}
          </div>
        </div>
      </main>
      <CardFooter />
    </>
  );
}
