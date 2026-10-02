import { CardForm } from "@/components/admin/CardForm";
import { emptyCardInput } from "@/lib/cards/defaults";

export const metadata = { title: "Nueva tarjeta | Tarjetas Digitales" };

export default function NewCardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva tarjeta</h1>
      <CardForm mode="create" initial={emptyCardInput(crypto.randomUUID())} />
    </div>
  );
}
