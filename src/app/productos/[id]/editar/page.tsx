"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import ProductForm, { type ValoresFormulario } from "@/components/ProductForm";
import { db } from "@/lib/db";
import { actualizarProducto, listarCategorias, type DatosProducto } from "@/lib/products";
import type { Producto } from "@/lib/types";

function aValoresFormulario(p: Producto): ValoresFormulario {
  return {
    nombre: p.nombre,
    categoria: p.categoria,
    unidad: p.unidad,
    calidad: p.calidad,
    fechaVencimiento: p.fechaVencimiento,
    cantidad: String(p.cantidad), // no se muestra ni se guarda en edición
    precioCompra: String(p.precioCompra),
    precioVenta: String(p.precioVenta),
  };
}

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // undefined = cargando; null = no existe. ProductForm toma los valores iniciales una sola
  // vez, así que un cambio en la base no pisa lo que el usuario está escribiendo.
  const producto = useLiveQuery(async () => (await db.productos.get(id)) ?? null, [id]);
  const categorias = useLiveQuery(listarCategorias, [], []);

  if (producto === undefined) {
    return <p className="text-center text-zinc-500">Cargando…</p>;
  }

  if (producto === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg font-semibold">Producto no encontrado</p>
        <Link href="/" className="text-emerald-700 hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  async function guardar(datos: DatosProducto) {
    await actualizarProducto(id, datos);
    router.push(`/productos/${id}`);
  }

  return (
    <div className="space-y-4">
      <Link href={`/productos/${id}`} className="text-sm text-emerald-700 hover:underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Editar producto</h1>
      <p className="text-sm text-zinc-500">
        La cantidad no se edita aquí: usa entradas y salidas en el detalle del producto.
      </p>
      <ProductForm
        key={producto.id}
        valoresIniciales={aValoresFormulario(producto)}
        mostrarCantidad={false}
        categorias={categorias}
        textoBoton="Guardar cambios"
        onGuardar={guardar}
      />
    </div>
  );
}
