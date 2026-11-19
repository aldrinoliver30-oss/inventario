import { db } from "./db";
import type { Movimiento, Producto } from "./types";

/** Campos que el usuario edita. `cantidad` queda fuera: solo cambia vía movimientos. */
export type DatosProducto = Omit<Producto, "id" | "cantidad" | "creadoEn" | "actualizadoEn">;

export const NOTA_STOCK_INICIAL = "Stock inicial";

/**
 * Crea un producto. Si la cantidad inicial es > 0, registra en la misma
 * transacción un movimiento "entrada" con la nota "Stock inicial".
 */
export async function crearProducto(
  datos: DatosProducto,
  cantidadInicial: number,
): Promise<Producto> {
  if (!Number.isFinite(cantidadInicial) || cantidadInicial < 0) {
    throw new Error("La cantidad inicial debe ser un número mayor o igual a 0.");
  }

  const ahora = new Date().toISOString();
  const producto: Producto = {
    ...datos,
    id: crypto.randomUUID(),
    cantidad: cantidadInicial,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  await db.transaction("rw", db.productos, db.movimientos, async () => {
    await db.productos.add(producto);
    if (cantidadInicial > 0) {
      const movimiento: Movimiento = {
        id: crypto.randomUUID(),
        productoId: producto.id,
        tipo: "entrada",
        cantidad: cantidadInicial,
        fecha: ahora,
        nota: NOTA_STOCK_INICIAL,
      };
      await db.movimientos.add(movimiento);
    }
  });

  return producto;
}

/** Actualiza los datos editables de un producto. Nunca modifica `cantidad`. */
export async function actualizarProducto(id: string, datos: DatosProducto): Promise<void> {
  // Se descartan campos no editables aunque lleguen en `datos` en tiempo de ejecución.
  const { nombre, categoria, unidad, calidad, fechaVencimiento, precioCompra, precioVenta } = datos;
  const cambios = await db.productos.update(id, {
    nombre,
    categoria,
    unidad,
    calidad,
    fechaVencimiento,
    precioCompra,
    precioVenta,
    actualizadoEn: new Date().toISOString(),
  });
  if (cambios === 0) {
    throw new Error("Producto no encontrado.");
  }
}

/** Elimina el producto y todo su historial de movimientos en una transacción. */
export async function eliminarProducto(id: string): Promise<void> {
  await db.transaction("rw", db.productos, db.movimientos, async () => {
    await db.movimientos.where("productoId").equals(id).delete();
    await db.productos.delete(id);
  });
}

/** Categorías ya usadas, sin repetir y en orden alfabético (para sugerencias). */
export async function listarCategorias(): Promise<string[]> {
  const claves = await db.productos.orderBy("categoria").uniqueKeys();
  return claves.map(String);
}
