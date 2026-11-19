"use client";

import { useState } from "react";
import { FILTROS_VACIOS, hayFiltros, type Filtros } from "@/lib/filtros";
import Icono from "./Icono";

export default function PanelFiltros({
  filtros,
  categorias,
  onChange,
}: {
  filtros: Filtros;
  categorias: string[];
  onChange: (f: Filtros) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const extra = filtros.categoria !== "" || filtros.calidadMin > 0 || filtros.stock !== "" || filtros.vencimiento !== "";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar por nombre o código</span>
          <Icono nombre="buscar" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={filtros.texto}
            onChange={(e) => onChange({ ...filtros, texto: e.target.value })}
            placeholder="Buscar por nombre o código"
            className="campo pl-10"
          />
        </label>
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-label="Filtros"
          className={`relative flex size-11.5 shrink-0 items-center justify-center rounded-xl ring-1 transition ${
            abierto || extra ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-zinc-700 ring-zinc-200"
          }`}
        >
          <Icono nombre="filtro" />
        </button>
      </div>

      {abierto && (
        <div className="tarjeta animar-entrada grid grid-cols-2 gap-3 p-3">
          <label className="col-span-2 text-sm font-medium text-zinc-700">
            Categoría
            <select
              value={filtros.categoria}
              onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}
              className="campo mt-1"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Stock
            <select
              value={filtros.stock}
              onChange={(e) => onChange({ ...filtros, stock: e.target.value as Filtros["stock"] })}
              className="campo mt-1"
            >
              <option value="">Todos</option>
              <option value="agotado">Agotado</option>
              <option value="bajo">Stock bajo</option>
              <option value="ok">Normal</option>
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Vencimiento
            <select
              value={filtros.vencimiento}
              onChange={(e) => onChange({ ...filtros, vencimiento: e.target.value as Filtros["vencimiento"] })}
              className="campo mt-1"
            >
              <option value="">Todos</option>
              <option value="vencido">Vencido</option>
              <option value="por-vencer">Por vencer</option>
              <option value="ok">Vigente</option>
              <option value="sin-fecha">No vence</option>
            </select>
          </label>
          <label className="col-span-2 text-sm font-medium text-zinc-700">
            Calidad mínima
            <select
              value={filtros.calidadMin}
              onChange={(e) => onChange({ ...filtros, calidadMin: Number(e.target.value) })}
              className="campo mt-1"
            >
              <option value={0}>Cualquiera</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} {n < 5 ? "o más" : ""}
                </option>
              ))}
            </select>
          </label>
          {hayFiltros(filtros) && (
            <button
              type="button"
              onClick={() => onChange(FILTROS_VACIOS)}
              className="boton-secundario col-span-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
