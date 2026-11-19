"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import DialogoConfirmar from "@/components/DialogoConfirmar";
import Encabezado from "@/components/Encabezado";
import Estrellas from "@/components/Estrellas";
import { EtiquetaStock, EtiquetaVencimiento } from "@/components/Etiquetas";
import FormularioMovimiento from "@/components/FormularioMovimiento";
import Icono from "@/components/Icono";
import ListaMovimientos from "@/components/ListaMovimientos";
import NoEncontrado from "@/components/NoEncontrado";
import { useToast } from "@/components/Toast";
import { db } from "@/lib/db";
import { estadoStock } from "@/lib/estados";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/formato";
import { eliminarProducto } from "@/lib/productos";
import type { Producto } from "@/lib/types";
import { rutaEditar } from "@/lib/rutas";

type Pestana = "detalles" | "movimientos";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">{titulo}</h2>
      <dl className="tarjeta divide-y divide-zinc-100 px-4">{children}</dl>
    </section>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-zinc-500">{etiqueta}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{children}</dd>
    </div>
  );
}

const vacio = <span className="font-normal text-zinc-400">—</span>;

function Detalles({ p }: { p: Producto }) {
  const margen = p.precioVenta - p.precioCompra;
  return (
    <div className="space-y-5">
      <Seccion titulo="Estado">
        <Dato etiqueta="Stock actual">
          {formatearCantidad(p.cantidad)} {p.unidad}
        </Dato>
        <Dato etiqueta="Stock mínimo">
          {p.stockMinimo > 0 ? `${formatearCantidad(p.stockMinimo)} ${p.unidad}` : "Solo avisar al agotarse"}
        </Dato>
        <Dato etiqueta="Vencimiento">
          <span className="flex flex-col items-end gap-1">
            {p.fechaVencimiento ? formatearFecha(p.fechaVencimiento) : "No vence"}
            <EtiquetaVencimiento fecha={p.fechaVencimiento} mostrarOk />
          </span>
        </Dato>
      </Seccion>

      <Seccion titulo="Calidad y lote">
        <Dato etiqueta="Calidad">
          <span className="flex items-center gap-2">
            <Estrellas valor={p.calidad} />
            <span className="text-sm text-zinc-500">{p.calidad}/5</span>
          </span>
        </Dato>
        <Dato etiqueta="Lote">{p.lote || vacio}</Dato>
      </Seccion>

      <Seccion titulo="Proveedor y código">
        <Dato etiqueta="Proveedor">{p.proveedor || vacio}</Dato>
        <Dato etiqueta="Código / SKU">{p.codigo ? <span className="font-mono text-sm">{p.codigo}</span> : vacio}</Dato>
        <Dato etiqueta="Categoría">{p.categoria}</Dato>
      </Seccion>

      <Seccion titulo="Precios">
        <Dato etiqueta="Compra">{formatearPrecio(p.precioCompra)}</Dato>
        <Dato etiqueta="Venta">{formatearPrecio(p.precioVenta)}</Dato>
        {p.precioCompra > 0 && p.precioVenta > 0 && (
          <Dato etiqueta="Margen por unidad">
            <span className={margen < 0 ? "text-red-600" : "text-emerald-700"}>
              {formatearPrecio(margen)} ({Math.round((margen / p.precioCompra) * 100)}%)
            </span>
          </Dato>
        )}
        <Dato etiqueta="Valor del stock">{formatearPrecio(p.cantidad * p.precioCompra)}</Dato>
      </Seccion>

      <section>
        <h2 className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Notas</h2>
        <div className="tarjeta px-4 py-3 text-sm whitespace-pre-wrap">
          {p.notas || <span className="text-zinc-400">Sin notas.</span>}
        </div>
      </section>

      <p className="px-1 text-xs text-zinc-400">
        Creado el {formatearFecha(p.creadoEn)} · Actualizado el {formatearFecha(p.actualizadoEn)}
      </p>
    </div>
  );
}

export default function DetalleProductoPage() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const toast = useToast();
  // undefined = cargando; null = no existe.
  const producto = useLiveQuery(async () => (await db.productos.get(id)) ?? null, [id]);
  const foto = useLiveQuery(async () => (await db.fotos.get(id))?.dataUrl ?? null, [id]);
  const [pestana, setPestana] = useState<Pestana>("detalles");
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function eliminar() {
    setEliminando(true);
    try {
      await eliminarProducto(id);
      toast({ tipo: "exito", titulo: "Producto eliminado" });
      router.replace("/");
    } catch (err) {
      toast({ tipo: "error", titulo: "No se pudo eliminar", mensaje: err instanceof Error ? err.message : undefined });
      setEliminando(false);
      setConfirmando(false);
    }
  }

  // Tras borrar, la consulta devuelve null antes de navegar: no mostrar "no encontrado".
  if (producto === undefined || (eliminando && producto === null)) {
    return <p className="py-12 text-center text-zinc-500">{eliminando ? "Eliminando…" : "Cargando…"}</p>;
  }
  if (producto === null) return <NoEncontrado />;

  const p = producto;
  const estado = estadoStock(p);

  return (
    <>
      <Encabezado titulo={p.nombre} subtitulo={p.categoria} volver="/">
        <Link
          href={rutaEditar(p.id)}
          className="rounded-full p-2 text-zinc-700 hover:bg-zinc-200/70"
          aria-label="Editar producto"
        >
          <Icono nombre="lapiz" />
        </Link>
      </Encabezado>

      <div className="space-y-4">
        {/* Resumen visual */}
        <div className="tarjeta overflow-hidden">
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element -- data URL local
            <img src={foto} alt={`Foto de ${p.nombre}`} className="aspect-[16/10] w-full object-cover" />
          )}
          <div className="flex items-end justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">Stock disponible</p>
              <p
                className={`text-4xl font-bold tracking-tight tabular-nums ${
                  estado === "agotado" ? "text-red-600" : estado === "bajo" ? "text-orange-600" : ""
                }`}
              >
                {formatearCantidad(p.cantidad)}
                <span className="ml-1.5 text-base font-medium text-zinc-500">{p.unidad}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <EtiquetaStock producto={p} />
              <EtiquetaVencimiento fecha={p.fechaVencimiento} />
              <Estrellas valor={p.calidad} />
            </div>
          </div>
        </div>

        {estado !== "ok" && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-2xl p-4 ${
              estado === "agotado" ? "bg-red-50 text-red-800" : "bg-orange-50 text-orange-800"
            }`}
          >
            <Icono nombre="alerta" className="mt-0.5 size-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{estado === "agotado" ? "Producto agotado" : "Stock bajo"}</p>
              <p>
                {estado === "agotado"
                  ? "No queda stock. Registra una entrada cuando repongas."
                  : `Quedan ${formatearCantidad(p.cantidad)} ${p.unidad}; el mínimo es ${formatearCantidad(p.stockMinimo)}.`}
              </p>
              {pestana !== "movimientos" && (
                <button type="button" onClick={() => setPestana("movimientos")} className="mt-1 font-semibold underline">
                  Registrar entrada
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div role="tablist" aria-label="Secciones del producto" className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-200/70 p-1">
          {(["detalles", "movimientos"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={pestana === t}
              aria-controls={`panel-${t}`}
              onClick={() => setPestana(t)}
              className={`min-h-10 rounded-lg text-sm font-semibold transition ${
                pestana === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
              }`}
            >
              {t === "detalles" ? "Detalles" : "Movimientos"}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`}>
          {pestana === "detalles" ? (
            <div className="space-y-5">
              <Detalles p={p} />
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="boton w-full text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              >
                <Icono nombre="basura" className="size-4" /> Eliminar producto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <FormularioMovimiento producto={p} />
              <h2 className="px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Historial</h2>
              <ListaMovimientos productoId={p.id} unidad={p.unidad} />
            </div>
          )}
        </div>
      </div>

      <DialogoConfirmar
        abierto={confirmando}
        titulo="¿Eliminar producto?"
        mensaje={`Se borrarán "${p.nombre}", su foto y todo su historial de movimientos. No se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligro
        ocupado={eliminando}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
