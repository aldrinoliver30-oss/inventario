"use client";

import type { ResumenAvisos } from "@/lib/estados";
import type { Filtros } from "@/lib/filtros";

type Clave = "agotado" | "bajo" | "vencido" | "por-vencer";

const ITEMS: {
  clave: Clave;
  texto: string;
  campo: keyof Omit<ResumenAvisos, "total">;
  color: string;
  activo: string;
}[] = [
  { clave: "agotado", texto: "Agotados", campo: "agotados", color: "text-red-600", activo: "ring-red-500 bg-red-50" },
  { clave: "bajo", texto: "Stock bajo", campo: "bajos", color: "text-orange-600", activo: "ring-orange-500 bg-orange-50" },
  { clave: "vencido", texto: "Vencidos", campo: "vencidos", color: "text-red-600", activo: "ring-red-500 bg-red-50" },
  { clave: "por-vencer", texto: "Por vencer", campo: "porVencer", color: "text-amber-600", activo: "ring-amber-500 bg-amber-50" },
];

function estaActivo(clave: Clave, f: Filtros): boolean {
  return clave === "agotado" || clave === "bajo" ? f.stock === clave : f.vencimiento === clave;
}

/** Contadores de avisos. Tocar uno filtra la lista; tocarlo de nuevo quita el filtro. */
export default function ResumenEstado({
  resumen,
  filtros,
  onFiltrar,
}: {
  resumen: ResumenAvisos;
  filtros: Filtros;
  onFiltrar: (f: Filtros) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ITEMS.map((it) => {
        const n = resumen[it.campo].length;
        const activo = estaActivo(it.clave, filtros);
        const esStock = it.clave === "agotado" || it.clave === "bajo";
        return (
          <button
            key={it.clave}
            type="button"
            aria-pressed={activo}
            onClick={() =>
              onFiltrar(
                esStock
                  ? { ...filtros, stock: activo ? "" : (it.clave as "agotado" | "bajo") }
                  : { ...filtros, vencimiento: activo ? "" : (it.clave as "vencido" | "por-vencer") },
              )
            }
            className={`tarjeta flex flex-col items-start px-2.5 py-2 text-left transition active:scale-[0.97] ${
              activo ? `ring-2 ${it.activo}` : ""
            }`}
          >
            <span className={`text-2xl leading-tight font-bold tabular-nums ${n > 0 ? it.color : "text-zinc-300"}`}>
              {n}
            </span>
            <span className="text-[11px] leading-tight font-medium text-zinc-600">{it.texto}</span>
          </button>
        );
      })}
    </div>
  );
}
