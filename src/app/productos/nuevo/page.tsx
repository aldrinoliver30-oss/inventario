"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import ProductForm from "@/components/ProductForm";
import { crearProducto, listarCategorias, type DatosProducto } from "@/lib/products";

export default function NuevoProductoPage() {
  const router = useRouter();
  const categorias = useLiveQuery(listarCategorias, [], []);

  async function guardar(datos: DatosProducto, cantidad: number) {
    const producto = await crearProducto(datos, cantidad);
    router.push(`/productos/${producto.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Volver
        </Link>
      </div>
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <ProductForm
        mostrarCantidad
        categorias={categorias}
        textoBoton="Guardar producto"
        onGuardar={guardar}
      />
    </div>
  );
}
