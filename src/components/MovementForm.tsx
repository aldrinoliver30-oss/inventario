"use client";

import { useState, type FormEvent } from "react";
import { NOTA_MAX, registrarMovimiento } from "@/lib/movements";
import type { TipoMovimiento, Unidad } from "@/lib/types";

interface Props {
  productoId: string;
  unidad: Unidad;
}

const claseInput =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

export default function MovementForm({ productoId, unidad }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const texto = cantidad.trim().replace(",", ".");
      await registrarMovimiento({
        productoId,
        tipo,
        cantidad: texto === "" ? 0 : Number(texto),
        nota,
      });
      setCantidad("");
      setNota("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  }

  const claseTipo = (t: TipoMovimiento) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
      tipo === t
        ? t === "entrada"
          ? "bg-emerald-700 text-white"
          : "bg-orange-600 text-white"
        : "bg-zinc-100 text-zinc-700"
    }`;

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900"
    >
      <h2 className="font-semibold">Registrar movimiento</h2>

      <div role="radiogroup" aria-label="Tipo de movimiento" className="flex gap-2">
        {(["entrada", "salida"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={claseTipo(t)}
          >
            {t === "entrada" ? "Entrada" : "Salida"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="mov-cantidad" className="block text-sm font-medium">
          Cantidad ({unidad})
        </label>
        <input
          id="mov-cantidad"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={claseInput}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "mov-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="mov-nota" className="block text-sm font-medium">
          Nota <span className="font-normal text-zinc-500">(opcional)</span>
        </label>
        <input
          id="mov-nota"
          type="text"
          maxLength={NOTA_MAX}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className={claseInput}
        />
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {guardando ? "Registrando…" : "Registrar"}
      </button>

      {error && (
        <p id="mov-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
