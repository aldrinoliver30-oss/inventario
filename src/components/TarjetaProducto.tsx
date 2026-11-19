import Link from "next/link";
import { estadoStock } from "@/lib/estados";
import { formatearCantidad, formatearPrecio } from "@/lib/formato";
import type { Producto } from "@/lib/types";
import Estrellas from "./Estrellas";
import { EtiquetaStock, EtiquetaVencimiento } from "./Etiquetas";
import { rutaProducto } from "@/lib/rutas";

const COLOR_STOCK = {
  agotado: "text-red-600",
  bajo: "text-orange-600",
  ok: "text-zinc-900",
} as const;

export default function TarjetaProducto({ producto: p }: { producto: Producto }) {
  const estado = estadoStock(p);
  return (
    <Link
      href={rutaProducto(p.id)}
      className="tarjeta flex items-center gap-3 p-3 transition hover:ring-zinc-900/10 active:scale-[0.99]"
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
          estado === "agotado"
            ? "bg-red-50 text-red-600"
            : estado === "bajo"
              ? "bg-orange-50 text-orange-600"
              : "bg-emerald-50 text-emerald-700"
        }`}
        aria-hidden="true"
      >
        {p.nombre.trim().charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p.nombre}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span className="truncate">{p.categoria}</span>
          <Estrellas valor={p.calidad} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <EtiquetaStock producto={p} />
          <EtiquetaVencimiento fecha={p.fechaVencimiento} />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-lg leading-tight font-bold tabular-nums ${COLOR_STOCK[estado]}`}>
          {formatearCantidad(p.cantidad)}
        </p>
        <p className="text-xs text-zinc-500">{p.unidad}</p>
        {p.precioVenta > 0 && (
          <p className="mt-0.5 text-xs text-zinc-400 tabular-nums">{formatearPrecio(p.precioVenta)}</p>
        )}
      </div>
    </Link>
  );
}
