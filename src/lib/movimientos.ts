import { db } from "./db";
import { estadoStock } from "./estados";
import { formatearCantidad } from "./formato";
import { redondearCantidad } from "./productos";
import { admiteDecimales } from "./validacion";
import type { EstadoStock, Movimiento, Producto, TipoMovimiento } from "./types";

export interface NuevoMovimiento {
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota?: string;
}

export interface ResultadoMovimiento {
  producto: Producto;
  antes: EstadoStock;
  despues: EstadoStock;
}

export class ErrorMovimiento extends Error {}

/**
 * Registra una entrada o salida y actualiza el stock en la misma transacción.
 * Lanza ErrorMovimiento si la cantidad no es válida o la salida supera el stock.
 */
export async function registrarMovimiento(m: NuevoMovimiento): Promise<ResultadoMovimiento> {
  if (!Number.isFinite(m.cantidad) || m.cantidad <= 0) {
    throw new ErrorMovimiento("La cantidad debe ser mayor que 0.");
  }
  const nota = m.nota?.trim();
  if (nota && nota.length > 200) throw new ErrorMovimiento("La nota admite máximo 200 caracteres.");

  return db.transaction("rw", db.productos, db.movimientos, async () => {
    const producto = await db.productos.get(m.productoId);
    if (!producto) throw new ErrorMovimiento("Producto no encontrado.");
    if (!admiteDecimales(producto.unidad) && !Number.isInteger(m.cantidad)) {
      throw new ErrorMovimiento(`La cantidad debe ser un número entero (${producto.unidad}).`);
    }
    if (m.tipo === "salida" && m.cantidad > producto.cantidad) {
      throw new ErrorMovimiento(
        `Stock insuficiente: solo hay ${formatearCantidad(producto.cantidad)} ${producto.unidad}.`,
      );
    }

    const antes = estadoStock(producto);
    const delta = m.tipo === "entrada" ? m.cantidad : -m.cantidad;
    const ahora = new Date().toISOString();
    const actualizado: Producto = {
      ...producto,
      cantidad: redondearCantidad(producto.cantidad + delta),
      actualizadoEn: ahora,
    };
    const mov: Movimiento = {
      id: crypto.randomUUID(),
      productoId: m.productoId,
      tipo: m.tipo,
      cantidad: m.cantidad,
      fecha: ahora,
      ...(nota ? { nota } : {}),
    };
    await db.productos.put(actualizado);
    await db.movimientos.add(mov);
    return { producto: actualizado, antes, despues: estadoStock(actualizado) };
  });
}
