"use client";

import { useRef, useState } from "react";
import { comprimirFoto } from "@/lib/fotos";
import Icono from "./Icono";

/** Selector de foto: cámara o galería. La imagen se reduce antes de entregarla. */
export default function EntradaFoto({
  valor,
  onChange,
}: {
  valor: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setProcesando(true);
    setError(null);
    try {
      onChange(await comprimirFoto(archivo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la foto.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={elegir} />
      {valor ? (
        <div className="relative overflow-hidden rounded-xl ring-1 ring-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
          <img src={valor} alt="Foto del producto" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute right-2 bottom-2 flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className="boton-secundario min-h-9 px-3 text-xs">
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="boton min-h-9 bg-white px-3 text-xs text-red-600 ring-1 ring-zinc-200"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={procesando}
          className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-white py-6 text-sm text-zinc-500 transition hover:border-emerald-500 hover:text-emerald-700"
        >
          <Icono nombre="camara" className="size-7" />
          {procesando ? "Procesando…" : "Tomar o elegir foto"}
        </button>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
