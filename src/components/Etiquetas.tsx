import { diasHasta, estadoStock, estadoVencimiento } from "@/lib/estados";
import type { Producto } from "@/lib/types";

const BASE = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

export function EtiquetaStock({ producto }: { producto: Pick<Producto, "cantidad" | "stockMinimo"> }) {
  const estado = estadoStock(producto);
  if (estado === "agotado") return <span className={`${BASE} bg-red-100 text-red-700`}>● Agotado</span>;
  if (estado === "bajo") return <span className={`${BASE} bg-orange-100 text-orange-700`}>● Stock bajo</span>;
  return null;
}

export function EtiquetaVencimiento({
  fecha,
  mostrarOk = false,
}: {
  fecha: string | null;
  mostrarOk?: boolean;
}) {
  const estado = estadoVencimiento(fecha);
  if (estado === "vencido") return <span className={`${BASE} bg-red-100 text-red-700`}>Vencido</span>;
  if (estado === "por-vencer") {
    const dias = diasHasta(fecha!);
    const texto = dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`;
    return <span className={`${BASE} bg-amber-100 text-amber-800`}>{texto}</span>;
  }
  if (!mostrarOk) return null;
  if (estado === "sin-fecha") return <span className={`${BASE} bg-zinc-100 text-zinc-600`}>No vence</span>;
  return <span className={`${BASE} bg-emerald-100 text-emerald-700`}>Vigente</span>;
}
