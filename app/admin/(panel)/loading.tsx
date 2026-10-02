import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div role="status" className="flex items-center gap-2 py-16 text-sm text-muted">
      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Cargando...
    </div>
  );
}
