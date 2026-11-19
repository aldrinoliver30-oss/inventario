"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExpiryBadge from "@/components/ExpiryBadge";
import MovementForm from "@/components/MovementForm";
import MovementList from "@/components/MovementList";
import StarRating from "@/components/StarRating";
import { db } from "@/lib/db";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/format";
import { eliminarProducto } from "@/lib/products";

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-zinc-500">{etiqueta}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export default function DetalleProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // undefined = cargando; null = no existe.
  const producto = useLiveQuery(async () => (await db.productos.get(id)) ?? null, [id]);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function eliminar() {
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarProducto(id);
      router.replace("/");
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
      setEliminando(false);
      setConfirmando(false);
    }
  }

  // Tras borrar, la consulta en vivo devuelve null antes de navegar: no mostrar "no encontrado".
  if (producto === undefined || (eliminando && producto === null)) {
    return <p className="text-center text-zinc-500">{eliminando ? "Eliminando…" : "Cargando…"}</p>;
  }

  if (producto === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg font-semibold">Producto no encontrado</p>
        <Link href="/" className="text-emerald-700 hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-emerald-700 hover:underline">
        ← Volver
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold">{producto.nombre}</h1>
          <p className="text-sm text-zinc-500">{producto.categoria}</p>
        </div>
        <ExpiryBadge fechaVencimiento={producto.fechaVencimiento} />
      </div>

      <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900">
        <Dato etiqueta="Stock">
          {formatearCantidad(producto.cantidad)} {producto.unidad}
        </Dato>
        <Dato etiqueta="Calidad">
          <StarRating value={producto.calidad} />
        </Dato>
        <Dato etiqueta="Vencimiento">{formatearFecha(producto.fechaVencimiento)}</Dato>
        <Dato etiqueta="Precio de compra">{formatearPrecio(producto.precioCompra)}</Dato>
        <Dato etiqueta="Precio de venta">{formatearPrecio(producto.precioVenta)}</Dato>
      </dl>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/productos/${producto.id}/editar`}
          className="rounded-lg border border-emerald-700 px-4 py-3 text-center font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-lg border border-red-600 px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>

      {errorEliminar && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errorEliminar}
        </p>
      )}

      <ConfirmDialog
        abierto={confirmando}
        titulo="¿Eliminar producto?"
        mensaje={`Se eliminarán "${producto.nombre}" y todo su historial de movimientos. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligro
        ocupado={eliminando}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      />

      <MovementForm productoId={producto.id} unidad={producto.unidad} />
      <MovementList productoId={producto.id} unidad={producto.unidad} />
    </div>
  );
}
