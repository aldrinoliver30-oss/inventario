"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { formatearCantidad, formatearFechaHora } from "@/lib/format";
import { listarMovimientos } from "@/lib/movements";
import type { Unidad } from "@/lib/types";

interface Props {
  productoId: string;
  unidad: Unidad;
}

export default function MovementList({ productoId, unidad }: Props) {
  const movimientos = useLiveQuery(() => listarMovimientos(productoId), [productoId]);

  return (
    <section className="space-y-2">
      <h2 className="font-semibold">Historial</h2>
      {movimientos === undefined ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : movimientos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin movimientos.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white text-zinc-900">
          {movimientos.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="text-sm text-zinc-500">{formatearFechaHora(m.fecha)}</p>
                {m.nota && <p className="break-words text-sm">{m.nota}</p>}
              </div>
              <span
                className={`shrink-0 font-semibold ${
                  m.tipo === "entrada" ? "text-emerald-700" : "text-orange-600"
                }`}
              >
                {m.tipo === "entrada" ? "+" : "−"}
                {formatearCantidad(m.cantidad)} {unidad}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
