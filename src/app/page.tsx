"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import ExpirySummary from "@/components/ExpirySummary";
import Filters from "@/components/Filters";
import ProductCard from "@/components/ProductCard";
import { db } from "@/lib/db";
import { FILTROS_VACIOS, filtrarProductos, type FiltrosProductos } from "@/lib/filters";

export default function Home() {
  // undefined mientras carga; ordenado por vencimiento, el más próximo primero.
  const productos = useLiveQuery(() => db.productos.orderBy("fechaVencimiento").toArray(), []);
  const [filtros, setFiltros] = useState<FiltrosProductos>(FILTROS_VACIOS);

  if (productos === undefined) {
    return <p className="text-center text-zinc-500">Cargando…</p>;
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-zinc-500">Todavía no hay productos.</p>
        <Link
          href="/productos/nuevo"
          className="rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          Agregar producto
        </Link>
      </div>
    );
  }

  const categorias = [...new Set(productos.map((p) => p.categoria))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const visibles = filtrarProductos(productos, filtros);

  return (
    <div className="space-y-4 pb-20">
      <ExpirySummary
        productos={productos}
        activo={filtros.estado}
        onSeleccionar={(estado) => setFiltros({ ...filtros, estado })}
      />

      <Filters valor={filtros} onChange={setFiltros} categorias={categorias} />

      <p className="text-sm text-zinc-500">
        {visibles.length} de {productos.length} productos
      </p>

      {visibles.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">No hay productos con estos filtros.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((p) => (
            <li key={p.id}>
              <ProductCard producto={p} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/productos/nuevo"
        aria-label="Agregar producto"
        className="fixed bottom-5 right-5 flex h-14 items-center gap-1 rounded-full bg-emerald-700 px-5 font-semibold text-white shadow-lg hover:bg-emerald-800"
      >
        <span aria-hidden className="text-2xl leading-none">+</span> Agregar
      </Link>
    </div>
  );
}
