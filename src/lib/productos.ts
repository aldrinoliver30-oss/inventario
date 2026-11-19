import { db } from "./db";
import type { DatosProducto, Movimiento, Producto } from "./types";

/** Redondea a 3 decimales para evitar errores de coma flotante (0.1 + 0.2). */
export function redondearCantidad(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Crea un producto. Si la cantidad es > 0 registra un movimiento "Stock inicial".
 * `foto` es un data URL opcional.
 */
export async function crearProducto(datos: DatosProducto, foto?: string | null): Promise<string> {
  const id = crypto.randomUUID();
  const ahora = new Date().toISOString();
  const producto: Producto = {
    ...datos,
    cantidad: redondearCantidad(datos.cantidad),
    id,
    tieneFoto: Boolean(foto),
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  await db.transaction("rw", db.productos, db.movimientos, db.fotos, async () => {
    await db.productos.add(producto);
    if (producto.cantidad > 0) {
      const mov: Movimiento = {
        id: crypto.randomUUID(),
        productoId: id,
        tipo: "entrada",
        cantidad: producto.cantidad,
        fecha: ahora,
        nota: "Stock inicial",
      };
      await db.movimientos.add(mov);
    }
    if (foto) await db.fotos.put({ productoId: id, dataUrl: foto });
  });
  return id;
}

/**
 * Actualiza los datos del producto sin tocar la cantidad.
 * `foto`: undefined = no cambia; null = quitar; string = reemplazar.
 */
export async function actualizarProducto(
  id: string,
  datos: Omit<DatosProducto, "cantidad">,
  foto?: string | null,
): Promise<void> {
  await db.transaction("rw", db.productos, db.fotos, async () => {
    const actual = await db.productos.get(id);
    if (!actual) throw new Error("Producto no encontrado.");
    const cambios: Partial<Producto> = { ...datos, actualizadoEn: new Date().toISOString() };
    // La cantidad solo cambia mediante movimientos: se descarta si llega en los datos.
    delete cambios.cantidad;
    if (foto === null) {
      await db.fotos.delete(id);
      cambios.tieneFoto = false;
    } else if (typeof foto === "string") {
      await db.fotos.put({ productoId: id, dataUrl: foto });
      cambios.tieneFoto = true;
    }
    await db.productos.update(id, cambios);
  });
}

/** Elimina el producto, su historial y su foto. */
export async function eliminarProducto(id: string): Promise<void> {
  await db.transaction("rw", db.productos, db.movimientos, db.fotos, async () => {
    await db.movimientos.where("productoId").equals(id).delete();
    await db.fotos.delete(id);
    await db.productos.delete(id);
  });
}
