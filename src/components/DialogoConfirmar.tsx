"use client";

import { useEffect, useRef } from "react";

export default function DialogoConfirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  peligro?: boolean;
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-5 shadow-xl backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm"
    >
      <h2 className="text-lg font-bold">{titulo}</h2>
      <p className="mt-2 text-sm text-zinc-600">{mensaje}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" className="boton-secundario" onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </button>
        <button
          type="button"
          className={peligro ? "boton-peligro" : "boton-primario"}
          onClick={onConfirmar}
          disabled={ocupado}
        >
          {textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
