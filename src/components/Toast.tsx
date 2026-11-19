"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Icono from "./Icono";

type TipoToast = "exito" | "alerta" | "error";

interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
}

type Mostrar = (t: Omit<Toast, "id">) => void;

const ToastContext = createContext<Mostrar>(() => {});

export function useToast(): Mostrar {
  return useContext(ToastContext);
}

const ESTILOS: Record<TipoToast, string> = {
  exito: "bg-zinc-900 text-white",
  alerta: "bg-amber-500 text-zinc-950",
  error: "bg-red-600 text-white",
};

/** Muestra avisos emergentes sobre la barra inferior. Duran 4 s (las alertas, 7 s). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const siguiente = useRef(0);

  const cerrar = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback<Mostrar>(
    (t) => {
      const id = ++siguiente.current;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      setTimeout(() => cerrar(id), t.tipo === "alerta" ? 7000 : 4000);
    },
    [cerrar],
  );

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "exito" ? "status" : "alert"}
            className={`animar-entrada pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 shadow-lg ${ESTILOS[t.tipo]}`}
          >
            <Icono
              nombre={t.tipo === "exito" ? "check" : "alerta"}
              className="mt-0.5 size-5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.titulo}</p>
              {t.mensaje && <p className="text-sm opacity-90">{t.mensaje}</p>}
            </div>
            <button
              type="button"
              onClick={() => cerrar(t.id)}
              className="-m-1 rounded-lg p-1 opacity-70 hover:opacity-100"
              aria-label="Cerrar aviso"
            >
              <Icono nombre="x" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
