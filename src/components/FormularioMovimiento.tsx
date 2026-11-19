"use client";

import { useState } from "react";
import { debeAvisarStock } from "@/lib/estados";
import { formatearCantidad } from "@/lib/formato";
import { registrarMovimiento } from "@/lib/movimientos";
import type { Producto, TipoMovimiento } from "@/lib/types";
import { admiteDecimales, leerNumero } from "@/lib/validacion";
import Icono from "./Icono";
import { useToast } from "./Toast";

export default function FormularioMovimiento({ producto }: { producto: Producto }) {
  const toast = useToast();
  const [tipo, setTipo] = useState<TipoMovimiento>("salida");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = leerNumero(cantidad);
    if (!(n > 0)) {
      setError("Escribe una cantidad mayor que 0.");
      return;
    }
    setGuardando(true);
    try {
      const r = await registrarMovimiento({ productoId: producto.id, tipo, cantidad: n, nota });
      setCantidad("");
      setNota("");
      const p = r.producto;
      if (debeAvisarStock(r.antes, r.despues)) {
        toast(
          r.despues === "agotado"
            ? { tipo: "alerta", titulo: `${p.nombre} se agotó`, mensaje: "El stock llegó a 0. Hora de reponer." }
            : {
                tipo: "alerta",
                titulo: `Stock bajo: ${p.nombre}`,
                mensaje: `Quedan ${formatearCantidad(p.cantidad)} ${p.unidad} (mínimo ${formatearCantidad(p.stockMinimo)}).`,
              },
        );
      } else {
        toast({
          tipo: "exito",
          titulo: tipo === "entrada" ? "Entrada registrada" : "Salida registrada",
          mensaje: `Stock actual: ${formatearCantidad(p.cantidad)} ${p.unidad}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="tarjeta space-y-3 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1" role="radiogroup" aria-label="Tipo de movimiento">
        {(["entrada", "salida"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => {
              setTipo(t);
              setError(null);
            }}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${
              tipo === t
                ? t === "entrada"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "bg-white text-orange-700 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            <Icono nombre={t} className="size-4" />
            {t === "entrada" ? "Entrada" : "Salida"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Cantidad</span>
          <input
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputMode={admiteDecimales(producto.unidad) ? "decimal" : "numeric"}
            placeholder={`Cantidad (${producto.unidad})`}
            aria-invalid={error ? true : undefined}
            className="campo"
          />
        </label>
        <button type="submit" disabled={guardando} className="boton-primario">
          {guardando ? "…" : "Registrar"}
        </button>
      </div>
      <label className="block">
        <span className="sr-only">Nota</span>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          maxLength={200}
          placeholder="Nota (opcional): cliente, factura…"
          className="campo"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
