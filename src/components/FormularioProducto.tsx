"use client";

import { useId, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { UNIDADES, type DatosProducto } from "@/lib/types";
import {
  admiteDecimales,
  validarProducto,
  type ErroresProducto,
  type FormularioProducto as Valores,
} from "@/lib/validacion";
import EntradaFoto from "./EntradaFoto";
import Estrellas from "./Estrellas";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="tarjeta space-y-4 p-4">
      <legend className="float-left mb-1 w-full text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Campo({
  etiqueta,
  error,
  ayuda,
  opcional,
  children,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {etiqueta}
        {opcional && <span className="font-normal text-zinc-400"> (opcional)</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : (
        ayuda && <span className="mt-1 block text-xs text-zinc-500">{ayuda}</span>
      )}
    </label>
  );
}

export default function FormularioProducto({
  inicial,
  fotoInicial = null,
  editando = false,
  textoGuardar,
  onGuardar,
}: {
  inicial: Valores;
  fotoInicial?: string | null;
  editando?: boolean;
  textoGuardar: string;
  /** `foto`: undefined = sin cambios, null = quitar, string = nueva. */
  onGuardar: (datos: DatosProducto, foto: string | null | undefined) => Promise<void>;
}) {
  const [v, setV] = useState<Valores>(inicial);
  const [foto, setFoto] = useState<string | null>(fotoInicial);
  const [fotoCambiada, setFotoCambiada] = useState(false);
  const [errores, setErrores] = useState<ErroresProducto>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const listaId = useId();

  const categorias = useLiveQuery(
    async () => [...new Set(await db.productos.orderBy("categoria").uniqueKeys())] as string[],
    [],
  );

  function set<K extends keyof Valores>(k: K, valor: Valores[K]) {
    setV((prev) => ({ ...prev, [k]: valor }));
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  }

  const texto = (k: keyof Valores) => ({
    value: v[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(k, e.target.value as never),
    "aria-invalid": errores[k] ? true : undefined,
    className: "campo",
  });

  const numerico = (k: keyof Valores, decimales: boolean) => ({
    ...texto(k),
    type: "text",
    inputMode: decimales ? ("decimal" as const) : ("numeric" as const),
    placeholder: "0",
  });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = validarProducto(v);
    if (!r.ok) {
      setErrores(r.errores);
      // Lleva al primer campo con error.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
      return;
    }
    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onGuardar(r.datos, fotoCambiada ? foto : undefined);
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  const dec = admiteDecimales(v.unidad);

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Seccion titulo="Producto">
        <Campo etiqueta="Nombre" error={errores.nombre}>
          <input {...texto("nombre")} maxLength={100} autoComplete="off" placeholder="Ej. Leche entera 1 L" />
        </Campo>
        <Campo etiqueta="Categoría" error={errores.categoria}>
          <input {...texto("categoria")} list={listaId} autoComplete="off" placeholder="Ej. Lácteos" />
          <datalist id={listaId}>
            {categorias?.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Campo>
        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Calidad</span>
          <Estrellas valor={v.calidad} onChange={(n) => set("calidad", n)} tamano="lg" invalido={!!errores.calidad} />
          {errores.calidad && <span className="mt-1 block text-sm text-red-600">{errores.calidad}</span>}
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Foto <span className="font-normal text-zinc-400">(opcional)</span>
          </span>
          <EntradaFoto
            valor={foto}
            onChange={(f) => {
              setFoto(f);
              setFotoCambiada(true);
            }}
          />
        </div>
      </Seccion>

      <Seccion titulo="Stock">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Unidad" error={errores.unidad}>
            <select {...texto("unidad")}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Campo>
          {!editando && (
            <Campo etiqueta="Cantidad inicial" error={errores.cantidad}>
              <input {...numerico("cantidad", dec)} />
            </Campo>
          )}
          <Campo
            etiqueta="Stock mínimo"
            error={errores.stockMinimo}
            ayuda="Avisa cuando el stock llegue a este número."
          >
            <input {...numerico("stockMinimo", dec)} />
          </Campo>
        </div>
        {editando && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            La cantidad se cambia con entradas y salidas, en la pestaña Movimientos.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Vencimiento y lote">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Vence el" error={errores.fechaVencimiento} ayuda="Vacío si no vence.">
            <input {...texto("fechaVencimiento")} type="date" />
          </Campo>
          <Campo etiqueta="Lote" opcional>
            <input {...texto("lote")} maxLength={50} autoComplete="off" />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Proveedor y código">
        <Campo etiqueta="Proveedor" opcional>
          <input {...texto("proveedor")} maxLength={100} />
        </Campo>
        <Campo etiqueta="Código / SKU" opcional>
          <input {...texto("codigo")} maxLength={50} autoComplete="off" autoCapitalize="characters" />
        </Campo>
      </Seccion>

      <Seccion titulo="Precios">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Compra" error={errores.precioCompra}>
            <input {...numerico("precioCompra", true)} placeholder="0,00" />
          </Campo>
          <Campo etiqueta="Venta" error={errores.precioVenta}>
            <input {...numerico("precioVenta", true)} placeholder="0,00" />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Notas">
        <Campo etiqueta="Observaciones" error={errores.notas} opcional>
          <textarea
            {...texto("notas")}
            rows={3}
            maxLength={1000}
            placeholder="Almacenamiento, condiciones, observaciones…"
          />
        </Campo>
      </Seccion>

      {Object.values(errores).some(Boolean) && (
        <p className="text-sm text-red-600">Revisa los campos marcados.</p>
      )}
      {errorGeneral && <p className="text-sm text-red-600">{errorGeneral}</p>}

      <button type="submit" disabled={guardando} className="boton-primario w-full text-base">
        {guardando ? "Guardando…" : textoGuardar}
      </button>
    </form>
  );
}
