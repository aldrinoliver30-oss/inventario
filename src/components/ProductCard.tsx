import Link from "next/link";
import ExpiryBadge from "@/components/ExpiryBadge";
import StarRating from "@/components/StarRating";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/format";
import type { Producto } from "@/lib/types";

export default function ProductCard({ producto }: { producto: Producto }) {
  return (
    <Link
      href={`/productos/${producto.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 shadow-sm active:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{producto.nombre}</p>
          <p className="truncate text-sm text-zinc-500">{producto.categoria}</p>
        </div>
        <ExpiryBadge fechaVencimiento={producto.fechaVencimiento} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <StarRating value={producto.calidad} />
        <span className="text-zinc-600">Vence {formatearFecha(producto.fechaVencimiento)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-sm">
        <span>
          <span className="font-medium">{formatearCantidad(producto.cantidad)}</span>{" "}
          {producto.unidad}
        </span>
        <span className="text-zinc-600">Venta {formatearPrecio(producto.precioVenta)}</span>
      </div>
    </Link>
  );
}
