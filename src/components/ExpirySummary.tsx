"use client";

import { contarPorEstado } from "@/lib/expiry";
import type { EstadoVencimiento, Producto } from "@/lib/types";

interface Props {
  productos: Producto[];
  /** Estado aplicado como filtro, o null si no hay. */
  activo: EstadoVencimiento | null;
  /** Tocar un contador aplica ese filtro; tocarlo de nuevo lo quita. */
  onSeleccionar: (estado: EstadoVencimiento | null) => void;
}

const TARJETAS: { estado: Extract<EstadoVencimiento, "vencido" | "por-vencer">; etiqueta: string; estilo: string }[] = [
  {
    estado: "vencido",
    etiqueta: "Vencidos",
    estilo: "border-red-200 bg-red-50 text-red-800 aria-pressed:ring-2 aria-pressed:ring-red-600",
  },
  {
    estado: "por-vencer",
    etiqueta: "Por vencer",
    estilo:
      "border-yellow-200 bg-yellow-50 text-yellow-900 aria-pressed:ring-2 aria-pressed:ring-yellow-600",
  },
];

export default function ExpirySummary({ productos, activo, onSeleccionar }: Props) {
  const conteo = contarPorEstado(productos);

  return (
    <div className="grid grid-cols-2 gap-3">
      {TARJETAS.map(({ estado, etiqueta, estilo }) => (
        <button
          key={estado}
          type="button"
          aria-pressed={activo === estado}
          onClick={() => onSeleccionar(activo === estado ? null : estado)}
          className={`rounded-xl border p-3 text-left ${estilo}`}
        >
          <span className="block text-3xl font-bold leading-none" data-testid={`conteo-${estado}`}>
            {conteo[estado]}
          </span>
          <span className="mt-1 block text-sm font-medium">{etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
