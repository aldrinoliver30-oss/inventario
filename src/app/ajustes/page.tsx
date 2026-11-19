"use client";

import { useRef, useState, type ChangeEvent } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { exportarDatos, importarDatos, leerRespaldo } from "@/lib/backup";
import { fechaLocalISO } from "@/lib/expiry";
import type { Respaldo } from "@/lib/types";

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

export default function AjustesPage() {
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [pendiente, setPendiente] = useState<Respaldo | null>(null);
  const [importando, setImportando] = useState(false);

  async function exportar() {
    setAviso(null);
    try {
      const respaldo = await exportarDatos();
      const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `inventario-${fechaLocalISO(new Date())}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setAviso({
        tipo: "ok",
        texto: `Exportados ${respaldo.productos.length} productos y ${respaldo.movimientos.length} movimientos.`,
      });
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo exportar." });
    }
  }

  async function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    setAviso(null);
    const archivo = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo después.
    e.target.value = "";
    if (!archivo) return;
    try {
      setPendiente(leerRespaldo(await archivo.text()));
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "Archivo inválido." });
    }
  }

  async function confirmarImportacion() {
    if (!pendiente) return;
    setImportando(true);
    try {
      await importarDatos(pendiente);
      setAviso({
        tipo: "ok",
        texto: `Importados ${pendiente.productos.length} productos y ${pendiente.movimientos.length} movimientos.`,
      });
    } catch (err) {
      setAviso({ tipo: "error", texto: err instanceof Error ? err.message : "No se pudo importar." });
    } finally {
      setImportando(false);
      setPendiente(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Ajustes</h1>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
        <h2 className="font-semibold">Respaldo de datos</h2>
        <p className="text-sm text-zinc-600">
          Tus datos solo se guardan en este navegador. Si borras los datos del navegador o cambias
          de celular, se pierden. Exporta un respaldo con frecuencia.
        </p>

        <button
          type="button"
          onClick={exportar}
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          Exportar
        </button>

        <input
          ref={inputArchivo}
          type="file"
          accept=".json,application/json"
          onChange={elegirArchivo}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => inputArchivo.current?.click()}
          className="w-full rounded-lg border border-emerald-700 px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Importar
        </button>

        {aviso && (
          <p
            role={aviso.tipo === "error" ? "alert" : "status"}
            className={`rounded-lg p-3 text-sm ${
              aviso.tipo === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {aviso.texto}
          </p>
        )}
      </section>

      <ConfirmDialog
        abierto={pendiente !== null}
        titulo="¿Importar respaldo?"
        mensaje={`Esto reemplazará todos los datos actuales por ${pendiente?.productos.length ?? 0} productos y ${pendiente?.movimientos.length ?? 0} movimientos del archivo. Esta acción no se puede deshacer.`}
        textoConfirmar="Importar"
        peligro
        ocupado={importando}
        onConfirmar={confirmarImportacion}
        onCancelar={() => setPendiente(null)}
      />
    </div>
  );
}
