import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardDetails, hasDetails } from "@/components/card/CardDetails";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

/** Modern: acciones en bloques, información en panel secundario, redes como iconos. */
export function ModernTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  const hasInfo = hasDetails(data);
  return (
    <>
      <main className="flex-1">
        <CardHeader data={data} />
        <div className="flex flex-col gap-6 px-5 pb-6 pt-7">
          <CardActions actions={main} data={data} />
          <CardSocialLinks links={social} className="justify-center" />
          {hasInfo ? (
            <section
              aria-label="Información"
              className="rounded-[calc(var(--card-radius)+4px)] bg-[var(--card-secondary)] p-5"
            >
              <CardDetails data={data} />
            </section>
          ) : null}
          {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} /> : null}
        </div>
      </main>
      <CardFooter />
    </>
  );
}
