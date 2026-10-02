import { buildActions } from "@/lib/cards/actions-builder";
import { CardActions } from "@/components/card/CardActions";
import { CardFooter } from "@/components/card/CardFooter";
import { CardHeader } from "@/components/card/CardHeader";
import { CardDetails } from "@/components/card/CardDetails";
import { CardQr } from "@/components/card/CardQr";
import { CardSocialLinks } from "@/components/card/CardSocialLinks";
import type { TemplateProps } from "./types";

const HARD_SHADOW_BUTTONS = [
  "[&_.cd-btn]:border-2 [&_.cd-btn]:border-[var(--card-text)] [&_.cd-btn]:font-extrabold",
  "[&_.cd-btn]:uppercase [&_.cd-btn]:tracking-wide [&_.cd-btn]:shadow-[4px_4px_0_var(--card-text)]",
  "[&_.cd-btn:active]:translate-x-[2px] [&_.cd-btn:active]:translate-y-[2px]",
  "[&_.cd-btn:active]:shadow-[2px_2px_0_var(--card-text)]",
  "[&_.cd-icon-btn]:border-2 [&_.cd-icon-btn]:border-[var(--card-text)]",
].join(" ");

/** Bold: titulares pesados en mayúsculas, bloque de color y botones con sombra dura. */
export function BoldTemplate({ data, qrSrc }: TemplateProps) {
  const { main, social } = buildActions(data);
  return (
    <>
      <main className={`flex-1 ${HARD_SHADOW_BUTTONS}`}>
        <div className="border-b-4 border-[var(--card-text)] bg-[var(--card-secondary)] pb-7">
          <CardHeader
            data={data}
            nameClassName="text-[2rem] font-black uppercase leading-[0.95] tracking-tight"
            categoryClassName="font-bold tracking-[0.2em]"
          />
        </div>
        <div className="flex flex-col gap-7 pl-5 pr-6 pb-6 pt-7">
          <CardActions actions={main} data={data} />
          <CardDetails data={data} />
          <CardSocialLinks links={social} />
          {data.showQr ? <CardQr src={qrSrc} businessName={data.businessName} className="items-start" /> : null}
        </div>
      </main>
      <CardFooter />
    </>
  );
}
