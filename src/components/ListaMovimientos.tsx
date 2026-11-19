"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatearCantidad, formatearFechaHora } from "@/lib/formato";
import type { Unidad } from "@/lib/types";
import Icono from "./Icono";

export default function ListaMovimientos({ productoId, unidad }: { productoId: string; unidad: Unidad }) {
  const movimientos = useLiveQuery(
    async () => (await db.movimientos.where("productoId").equals(productoId).sortBy("fecha")).reverse(),
    [productoId],
  );

  if (!movimientos) return null;
  if (movimientos.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500">Todavía no hay movimientos.</p>;
  }

  return (
    <ul className="tarjeta divide-y divide-zinc-100">
      {movimientos.map((m) => {
        const entrada = m.tipo === "entrada";
        return (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                entrada ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              }`}
            >
              <Icono nombre={m.tipo} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{entrada ? "Entrada" : "Salida"}</p>
              <p className="truncate text-xs text-zinc-500">
                {formatearFechaHora(m.fecha)}
                {m.nota && ` · ${m.nota}`}
              </p>
            </div>
            <span className={`font-semibold tabular-nums ${entrada ? "text-emerald-700" : "text-orange-700"}`}>
              {entrada ? "+" : "−"}
              {formatearCantidad(m.cantidad)} <span className="text-xs font-normal text-zinc-500">{unidad}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
