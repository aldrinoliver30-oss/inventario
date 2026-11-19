"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import Encabezado from "@/components/Encabezado";
import Icono from "@/components/Icono";
import PanelFiltros from "@/components/PanelFiltros";
import ResumenEstado from "@/components/ResumenEstado";
import TarjetaProducto from "@/components/TarjetaProducto";
import { db } from "@/lib/db";
import { hoyISO, resumenAvisos } from "@/lib/estados";
import { FILTROS_VACIOS, filtrarProductos, hayFiltros, ordenarProductos, type Filtros } from "@/lib/filtros";

// Conserva los filtros al ir al detalle y volver (solo durante la sesión).
let filtrosGuardados: Filtros = FILTROS_VACIOS;

export default function InicioPage() {
  // "hoy" se lee dentro de la consulta: solo corre en el navegador, nunca en el prerender.
  const datos = useLiveQuery(async () => ({ productos: await db.productos.toArray(), hoy: hoyISO() }), []);
  const productos = datos?.productos;
  const [filtros, setFiltrosState] = useState<Filtros>(filtrosGuardados);

  function setFiltros(f: Filtros) {
    filtrosGuardados = f;
    setFiltrosState(f);
  }

  const categorias = useMemo(
    () => [...new Set((productos ?? []).map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, "es")),
    [productos],
  );
  const resumen = useMemo(() => (datos ? resumenAvisos(datos.productos, datos.hoy) : null), [datos]);
  const visibles = useMemo(
    () => (datos ? ordenarProductos(filtrarProductos(datos.productos, filtros, datos.hoy)) : []),
    [datos, filtros],
  );

  return (
    <>
      <Encabezado
        titulo="Inventario"
        subtitulo={productos ? `${productos.length} ${productos.length === 1 ? "producto" : "productos"}` : " "}
      />

      {productos === undefined || resumen === null ? (
        <p className="py-12 text-center text-zinc-500">Cargando…</p>
      ) : productos.length === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Icono nombre="caja" className="size-7" />
          </div>
          <p className="text-lg font-semibold">Aún no hay productos</p>
          <p className="text-sm text-zinc-500">
            Agrega tu primer producto para controlar su stock, calidad y vencimiento.
          </p>
          <Link href="/productos/nuevo" className="boton-primario mt-2">
            <Icono nombre="mas" /> Agregar producto
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <ResumenEstado resumen={resumen} filtros={filtros} onFiltrar={setFiltros} />
          <PanelFiltros filtros={filtros} categorias={categorias} onChange={setFiltros} />

          {visibles.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              <p>Ningún producto coincide con los filtros.</p>
              <button
                type="button"
                onClick={() => setFiltros(FILTROS_VACIOS)}
                className="mt-2 font-semibold text-emerald-700"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ul className="space-y-2 pb-16">
              {hayFiltros(filtros) && (
                <li className="px-1 text-xs text-zinc-500">
                  Mostrando {visibles.length} de {productos.length}
                </li>
              )}
              {visibles.map((p) => (
                <li key={p.id}>
                  <TarjetaProducto producto={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {productos && productos.length > 0 && (
        <Link
          href="/productos/nuevo"
          aria-label="Agregar producto"
          className="fixed right-[max(1rem,calc(50%-14rem+1rem))] z-30 flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-95"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <Icono nombre="mas" className="size-7" grosor={2.4} />
        </Link>
      )}
    </>
  );
}
