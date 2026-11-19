"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import Encabezado from "@/components/Encabezado";
import Icono from "@/components/Icono";
import { db } from "@/lib/db";
import { diasHasta, resumenAvisos } from "@/lib/estados";
import { formatearCantidad, formatearFecha } from "@/lib/formato";
import type { Producto } from "@/lib/types";
import { rutaProducto } from "@/lib/rutas";

interface Grupo {
  titulo: string;
  descripcion: string;
  productos: Producto[];
  punto: string;
  detalle: (p: Producto) => string;
}

function GrupoAvisos({ g }: { g: Grupo }) {
  if (g.productos.length === 0) return null;
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <span className={`size-2.5 rounded-full ${g.punto}`} aria-hidden="true" />
        <h2 className="text-sm font-semibold">
          {g.titulo} <span className="font-normal text-zinc-500">({g.productos.length})</span>
        </h2>
      </div>
      <p className="mb-2 px-1 text-xs text-zinc-500">{g.descripcion}</p>
      <ul className="tarjeta divide-y divide-zinc-100">
        {g.productos.map((p) => (
          <li key={p.id}>
            <Link href={rutaProducto(p.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.nombre}</p>
                <p className="truncate text-xs text-zinc-500">{g.detalle(p)}</p>
              </div>
              <Icono nombre="atras" className="size-4 rotate-180 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AvisosPage() {
  const productos = useLiveQuery(() => db.productos.toArray(), []);

  if (!productos) {
    return (
      <>
        <Encabezado titulo="Avisos" />
        <p className="py-12 text-center text-zinc-500">Cargando…</p>
      </>
    );
  }

  const r = resumenAvisos(productos);
  const porNombre = (a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre, "es");
  const porFecha = (a: Producto, b: Producto) => (a.fechaVencimiento! < b.fechaVencimiento! ? -1 : 1);
  const stock = (p: Producto) =>
    `Quedan ${formatearCantidad(p.cantidad)} ${p.unidad} · mínimo ${formatearCantidad(p.stockMinimo)}`;

  const grupos: Grupo[] = [
    {
      titulo: "Agotados",
      descripcion: "Sin stock. Registra una entrada al reponer.",
      productos: [...r.agotados].sort(porNombre),
      punto: "bg-red-500",
      detalle: (p) => (p.proveedor ? `Proveedor: ${p.proveedor}` : p.categoria),
    },
    {
      titulo: "Stock bajo",
      descripcion: "En su stock mínimo o por debajo.",
      productos: [...r.bajos].sort((a, b) => a.cantidad / (a.stockMinimo || 1) - b.cantidad / (b.stockMinimo || 1)),
      punto: "bg-orange-500",
      detalle: stock,
    },
    {
      titulo: "Vencidos",
      descripcion: "La fecha de vencimiento ya pasó.",
      productos: [...r.vencidos].sort(porFecha),
      punto: "bg-red-500",
      detalle: (p) => `Venció el ${formatearFecha(p.fechaVencimiento!)}${p.lote ? ` · Lote ${p.lote}` : ""}`,
    },
    {
      titulo: "Por vencer",
      descripcion: "Vencen en los próximos 30 días.",
      productos: [...r.porVencer].sort(porFecha),
      punto: "bg-amber-400",
      detalle: (p) => {
        const d = diasHasta(p.fechaVencimiento!);
        const cuando = d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;
        return `Vence ${cuando} (${formatearFecha(p.fechaVencimiento!)})${p.lote ? ` · Lote ${p.lote}` : ""}`;
      },
    },
  ];

  return (
    <>
      <Encabezado
        titulo="Avisos"
        subtitulo={r.total === 0 ? "Todo en orden" : `${r.total} ${r.total === 1 ? "producto necesita" : "productos necesitan"} atención`}
      />
      {r.total === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Icono nombre="check" className="size-7" />
          </div>
          <p className="text-lg font-semibold">Sin avisos</p>
          <p className="text-sm text-zinc-500">
            Ningún producto está agotado, con stock bajo, vencido ni por vencer.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <GrupoAvisos key={g.titulo} g={g} />
          ))}
        </div>
      )}
    </>
  );
}
