"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import DialogoConfirmar from "@/components/DialogoConfirmar";
import Encabezado from "@/components/Encabezado";
import Icono from "@/components/Icono";
import { useToast } from "@/components/Toast";
import {
  consultarAlmacenamiento,
  TEXTO_ALMACENAMIENTO,
  type EstadoAlmacenamiento,
} from "@/lib/almacenamiento";
import { db } from "@/lib/db";
import { hoyISO } from "@/lib/estados";
import { exportarDatos, importarDatos, nombreArchivoRespaldo, validarRespaldo } from "@/lib/respaldo";
import type { Respaldo } from "@/lib/types";

export default function AjustesPage() {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pendiente, setPendiente] = useState<Respaldo | null>(null);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [almacenamiento, setAlmacenamiento] = useState<EstadoAlmacenamiento | null>(null);
  useEffect(() => {
    void consultarAlmacenamiento().then(setAlmacenamiento);
  }, []);
  const conteo = useLiveQuery(async () => ({
    productos: await db.productos.count(),
    movimientos: await db.movimientos.count(),
    fotos: await db.fotos.count(),
  }));

  async function exportar() {
    setError(null);
    try {
      const datos = await exportarDatos();
      const blob = new Blob([JSON.stringify(datos)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivoRespaldo(hoyISO());
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ tipo: "exito", titulo: "Respaldo descargado" });
    } catch {
      setError("No se pudo exportar.");
    }
  }

  async function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError(null);
    try {
      setPendiente(validarRespaldo(JSON.parse(await archivo.text())));
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "El archivo no es un JSON válido."
          : err instanceof Error
            ? err.message
            : "Archivo no válido.",
      );
    }
  }

  async function confirmarImportar() {
    if (!pendiente) return;
    setImportando(true);
    try {
      await importarDatos(pendiente);
      toast({ tipo: "exito", titulo: "Datos importados", mensaje: `${pendiente.productos.length} productos restaurados.` });
      setPendiente(null);
    } catch {
      setError("No se pudo importar. Tus datos no se modificaron.");
      setPendiente(null);
    } finally {
      setImportando(false);
    }
  }

  return (
    <>
      <Encabezado titulo="Ajustes" />
      <div className="space-y-5">
        <section className="tarjeta p-4">
          <h2 className="font-semibold">Tus datos</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Se guardan solo en este navegador. Si borras los datos del navegador o cambias de celular se pierden:
            exporta un respaldo con frecuencia.
          </p>
          {conteo && (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Productos", conteo.productos],
                  ["Movimientos", conteo.movimientos],
                  ["Fotos", conteo.fotos],
                ] as const
              ).map(([t, n]) => (
                <div key={t} className="rounded-xl bg-zinc-50 py-2">
                  <dd className="text-lg font-bold tabular-nums">{n}</dd>
                  <dt className="text-xs text-zinc-500">{t}</dt>
                </div>
              ))}
            </dl>
          )}
          {almacenamiento && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <span
                className={`size-2 rounded-full ${almacenamiento === "persistente" ? "bg-emerald-500" : "bg-zinc-400"}`}
                aria-hidden="true"
              />
              Almacenamiento persistente: {TEXTO_ALMACENAMIENTO[almacenamiento]}
            </p>
          )}
        </section>

        <section className="tarjeta p-4">
          <h2 className="font-semibold">Usar como app</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Desde el menú del navegador elige <strong>Instalar app</strong> o{" "}
            <strong>Agregar a pantalla de inicio</strong>. Funciona sin internet.
          </p>
        </section>

        <section className="tarjeta space-y-3 p-4">
          <h2 className="font-semibold">Respaldo</h2>
          <button type="button" onClick={exportar} className="boton-primario w-full">
            <Icono nombre="descargar" className="size-4" /> Exportar respaldo (.json)
          </button>
          <button type="button" onClick={() => input.current?.click()} className="boton-secundario w-full">
            <Icono nombre="subir" className="size-4" /> Importar respaldo
          </button>
          <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={elegirArchivo} />
          <p className="text-xs text-zinc-500">Importar reemplaza todos los datos actuales.</p>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      </div>

      <DialogoConfirmar
        abierto={pendiente !== null}
        titulo="¿Importar respaldo?"
        mensaje={`Se reemplazarán todos los datos actuales por ${pendiente?.productos.length ?? 0} productos y ${
          pendiente?.movimientos.length ?? 0
        } movimientos del archivo. No se puede deshacer.`}
        textoConfirmar="Importar"
        peligro
        ocupado={importando}
        onConfirmar={confirmarImportar}
        onCancelar={() => setPendiente(null)}
      />
    </>
  );
}
