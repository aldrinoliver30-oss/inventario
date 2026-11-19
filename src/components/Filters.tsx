"use client";

import { ETIQUETAS_VENCIMIENTO } from "@/components/ExpiryBadge";
import { FILTROS_VACIOS, hayFiltrosActivos, type FiltrosProductos } from "@/lib/filters";
import type { Calidad, EstadoVencimiento } from "@/lib/types";

interface Props {
  valor: FiltrosProductos;
  onChange: (filtros: FiltrosProductos) => void;
  categorias: string[];
}

const claseCampo =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

const ESTADOS: EstadoVencimiento[] = ["vencido", "por-vencer", "ok"];

export default function Filters({ valor, onChange, categorias }: Props) {
  const cambiar = (parcial: Partial<FiltrosProductos>) => onChange({ ...valor, ...parcial });

  return (
    <div className="space-y-2">
      <label htmlFor="busqueda" className="sr-only">
        Buscar por nombre
      </label>
      <input
        id="busqueda"
        type="search"
        placeholder="Buscar por nombre…"
        value={valor.busqueda}
        onChange={(e) => cambiar({ busqueda: e.target.value })}
        className={claseCampo}
      />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="filtro-categoria" className="block text-xs font-medium text-zinc-600">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={valor.categoria}
            onChange={(e) => cambiar({ categoria: e.target.value })}
            className={`${claseCampo} px-2 text-sm`}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-calidad" className="block text-xs font-medium text-zinc-600">
            Calidad mín.
          </label>
          <select
            id="filtro-calidad"
            value={valor.calidadMinima}
            onChange={(e) => cambiar({ calidadMinima: Number(e.target.value) as Calidad | 0 })}
            className={`${claseCampo} px-2 text-sm`}
          >
            <option value={0}>Cualquiera</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-estado" className="block text-xs font-medium text-zinc-600">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={valor.estado ?? ""}
            onChange={(e) => cambiar({ estado: (e.target.value || null) as EstadoVencimiento | null })}
            className={`${claseCampo} px-2 text-sm`}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_VENCIMIENTO[e]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hayFiltrosActivos(valor) && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => onChange(FILTROS_VACIOS)}
            className="text-sm text-emerald-700 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
