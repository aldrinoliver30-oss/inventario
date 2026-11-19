"use client";

import { useEffect, useRef, useState } from "react";
import { Serwist } from "@serwist/window";
import { solicitarAlmacenamientoPersistente } from "@/lib/almacenamiento";
import Icono from "./Icono";

/**
 * Registra el service worker (solo en producción), pide almacenamiento persistente
 * y muestra "Hay una nueva versión" cuando hay un service worker nuevo esperando.
 */
export default function PwaUpdater() {
  const sw = useRef<Serwist | null>(null);
  const [hayVersion, setHayVersion] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    void solicitarAlmacenamientoPersistente();

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const serwist = new Serwist("/serwist/sw.js", { scope: "/", type: "classic" });
    sw.current = serwist;
    serwist.addEventListener("waiting", () => setHayVersion(true));
    void serwist.register();

    // Busca versiones nuevas al volver a la app.
    const revisar = () => {
      if (document.visibilityState === "visible") void serwist.update();
    };
    document.addEventListener("visibilitychange", revisar);
    return () => document.removeEventListener("visibilitychange", revisar);
  }, []);

  function actualizar() {
    const serwist = sw.current;
    if (!serwist) return;
    setActualizando(true);
    serwist.addEventListener("controlling", () => window.location.reload());
    serwist.messageSkipWaiting();
  }

  if (!hayVersion) return null;

  return (
    <div
      role="alert"
      className="animar-entrada fixed inset-x-0 top-0 z-50 mx-auto max-w-md px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-lg">
        <Icono nombre="descargar" className="size-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">Hay una nueva versión</p>
        <button
          type="button"
          onClick={actualizar}
          disabled={actualizando}
          className="boton min-h-9 bg-emerald-500 px-3 text-white hover:bg-emerald-400"
        >
          {actualizando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>
    </div>
  );
}
