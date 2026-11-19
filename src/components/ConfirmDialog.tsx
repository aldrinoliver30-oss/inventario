"use client";

import { useEffect, useRef } from "react";

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  /** Botón de confirmar en rojo, para acciones destructivas. */
  peligro?: boolean;
  /** Deshabilita los botones mientras se ejecuta la acción. */
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Diálogo modal nativo (<dialog>): atrapa el foco y se cierra con Esc. */
export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-titulo"
      aria-describedby="confirm-mensaje"
      onCancel={(e) => {
        // Esc: cerrar a través del estado del padre.
        e.preventDefault();
        if (!ocupado) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-black/40"
    >
      <h2 id="confirm-titulo" className="text-lg font-semibold">
        {titulo}
      </h2>
      <p id="confirm-mensaje" className="mt-2 text-sm text-zinc-600">
        {mensaje}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          autoFocus
          disabled={ocupado}
          onClick={onCancelar}
          className="rounded-lg border border-zinc-300 px-4 py-3 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={onConfirmar}
          className={`rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-60 ${
            peligro ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"
          }`}
        >
          {textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
