import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardDetails } from "@/components/card/CardDetails";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

function Rule() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-24 items-center gap-2 text-[var(--card-accent)]">
      <span className="h-px flex-1 bg-current" />
      <span className="size-1.5 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}

/** Elegant: marco fino, mayúsculas espaciadas, divisores ornamentales. */
export function ElegantTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  return (
    <main className="flex flex-1 flex-col p-3">
      <div className="flex flex-1 flex-col border border-[var(--card-accent)] p-1.5">
        <div className="flex flex-1 flex-col border border-[color-mix(in_srgb,var(--card-accent)_45%,transparent)] pb-4">
          <CardHeader
            data={data}
            nameClassName="font-semibold uppercase tracking-[0.16em] text-[1.45rem]"
            categoryClassName="tracking-[0.3em] text-[0.68rem]"
          />
          <div className="flex flex-col gap-7 px-5 pb-4 pt-7">
            <Rule />
            <CardActions actions={main} data={data} />
            <CardDetails data={data} variant="plain" className="text-center" />
            <Rule />
            <CardSocialLinks links={social} className="justify-center" />
            {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} /> : null}
          </div>
          <CardFooter className="mt-auto" />
        </div>
      </div>
    </main>
  );
}
