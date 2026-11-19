"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import StarRating from "@/components/StarRating";
import type { DatosProducto } from "@/lib/products";
import { UNIDADES, type Calidad, type Unidad } from "@/lib/types";

/** Estado del formulario: los números se guardan como texto, tal cual se escriben. */
export interface ValoresFormulario {
  nombre: string;
  categoria: string;
  unidad: Unidad | "";
  calidad: Calidad | 0;
  fechaVencimiento: string;
  cantidad: string;
  precioCompra: string;
  precioVenta: string;
}

export type ErroresFormulario = Partial<Record<keyof ValoresFormulario, string>>;

export const VALORES_VACIOS: ValoresFormulario = {
  nombre: "",
  categoria: "",
  unidad: "",
  calidad: 0,
  fechaVencimiento: "",
  cantidad: "0",
  precioCompra: "0",
  precioVenta: "0",
};

/** Convierte texto a número (acepta coma decimal). Vacío = 0. NaN si no es un número. */
function aNumero(texto: string): number {
  const limpio = texto.trim().replace(",", ".");
  return limpio === "" ? 0 : Number(limpio);
}

function validarNoNegativo(texto: string): string | undefined {
  const n = aNumero(texto);
  if (!Number.isFinite(n)) return "Debe ser un número.";
  if (n < 0) return "No puede ser negativo.";
  return undefined;
}

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Valida el formulario. Devuelve los errores por campo, o los datos listos
 * para guardar si no hay errores.
 */
export function validarFormularioProducto(
  v: ValoresFormulario,
  conCantidad: boolean,
):
  | { ok: true; datos: DatosProducto; cantidad: number }
  | { ok: false; errores: ErroresFormulario } {
  const errores: ErroresFormulario = {};
  const nombre = v.nombre.trim();
  const categoria = v.categoria.trim();

  if (!nombre) errores.nombre = "El nombre es obligatorio.";
  else if (nombre.length > 100) errores.nombre = "Máximo 100 caracteres.";
  if (!categoria) errores.categoria = "La categoría es obligatoria.";
  if (!v.unidad) errores.unidad = "Elige una unidad.";
  if (!v.calidad) errores.calidad = "Elige una calidad de 1 a 5 estrellas.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.fechaVencimiento)) {
    errores.fechaVencimiento = "La fecha de vencimiento es obligatoria.";
  }
  if (conCantidad) {
    const e = validarNoNegativo(v.cantidad);
    if (e) errores.cantidad = e;
  }
  const eCompra = validarNoNegativo(v.precioCompra);
  if (eCompra) errores.precioCompra = eCompra;
  const eVenta = validarNoNegativo(v.precioVenta);
  if (eVenta) errores.precioVenta = eVenta;

  if (Object.keys(errores).length > 0 || !v.unidad || !v.calidad) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      nombre,
      categoria,
      unidad: v.unidad,
      calidad: v.calidad,
      fechaVencimiento: v.fechaVencimiento,
      precioCompra: redondear2(aNumero(v.precioCompra)),
      precioVenta: redondear2(aNumero(v.precioVenta)),
    },
    cantidad: conCantidad ? aNumero(v.cantidad) : 0,
  };
}

const claseInput =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 " +
  "aria-[invalid=true]:border-red-500";

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface Props {
  valoresIniciales?: ValoresFormulario;
  /** false en el formulario de edición: la cantidad solo cambia por movimientos. */
  mostrarCantidad: boolean;
  /** Categorías ya usadas, para sugerir en el <datalist>. */
  categorias: string[];
  textoBoton: string;
  onGuardar: (datos: DatosProducto, cantidad: number) => Promise<void>;
}

export default function ProductForm({
  valoresIniciales = VALORES_VACIOS,
  mostrarCantidad,
  categorias,
  textoBoton,
  onGuardar,
}: Props) {
  const [valores, setValores] = useState<ValoresFormulario>(valoresIniciales);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar<K extends keyof ValoresFormulario>(campo: K, valor: ValoresFormulario[K]) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    const resultado = validarFormularioProducto(valores, mostrarCantidad);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(resultado.datos, resultado.cantidad);
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  const ariaError = (campo: keyof ValoresFormulario) =>
    errores[campo]
      ? { "aria-invalid": true as const, "aria-describedby": `${campo}-error` }
      : {};

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
        <input
          id="nombre"
          type="text"
          maxLength={100}
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          className={claseInput}
          {...ariaError("nombre")}
        />
      </Campo>

      <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
        <input
          id="categoria"
          type="text"
          list="categorias-sugeridas"
          value={valores.categoria}
          onChange={(e) => cambiar("categoria", e.target.value)}
          className={claseInput}
          {...ariaError("categoria")}
        />
        <datalist id="categorias-sugeridas">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>

      <Campo id="unidad" etiqueta="Unidad" error={errores.unidad}>
        <select
          id="unidad"
          value={valores.unidad}
          onChange={(e) => cambiar("unidad", e.target.value as Unidad | "")}
          className={claseInput}
          {...ariaError("unidad")}
        >
          <option value="">Elige…</option>
          {UNIDADES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Campo>

      <div>
        <span className="block text-sm font-medium">Calidad</span>
        <StarRating
          id="calidad"
          size="lg"
          value={valores.calidad}
          onChange={(c) => cambiar("calidad", c)}
        />
        {errores.calidad && (
          <p id="calidad-error" className="mt-1 text-sm text-red-600">
            {errores.calidad}
          </p>
        )}
      </div>

      <Campo id="fechaVencimiento" etiqueta="Fecha de vencimiento" error={errores.fechaVencimiento}>
        <input
          id="fechaVencimiento"
          type="date"
          value={valores.fechaVencimiento}
          onChange={(e) => cambiar("fechaVencimiento", e.target.value)}
          className={claseInput}
          {...ariaError("fechaVencimiento")}
        />
      </Campo>

      {mostrarCantidad && (
        <Campo id="cantidad" etiqueta="Cantidad inicial" error={errores.cantidad}>
          <input
            id="cantidad"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={valores.cantidad}
            onChange={(e) => cambiar("cantidad", e.target.value)}
            className={claseInput}
            {...ariaError("cantidad")}
          />
        </Campo>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo id="precioCompra" etiqueta="Precio de compra" error={errores.precioCompra}>
          <input
            id="precioCompra"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={valores.precioCompra}
            onChange={(e) => cambiar("precioCompra", e.target.value)}
            className={claseInput}
            {...ariaError("precioCompra")}
          />
        </Campo>
        <Campo id="precioVenta" etiqueta="Precio de venta" error={errores.precioVenta}>
          <input
            id="precioVenta"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={valores.precioVenta}
            onChange={(e) => cambiar("precioVenta", e.target.value)}
            className={claseInput}
            {...ariaError("precioVenta")}
          />
        </Campo>
      </div>

      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : textoBoton}
      </button>
    </form>
  );
}
