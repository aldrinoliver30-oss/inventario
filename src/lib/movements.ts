import { db } from "./db";
import type { Movimiento, TipoMovimiento } from "./types";

export const NOTA_MAX = 200;

export interface NuevoMovimiento {
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota?: string;
}

/** Error de validación de un movimiento; su mensaje se muestra tal cual en la UI. */
export class ErrorMovimiento extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorMovimiento";
  }
}

/**
 * Registra una entrada o salida y ajusta la cantidad del producto en la misma
 * transacción. Rechaza cantidades <= 0 y salidas mayores al stock disponible.
 */
export async function registrarMovimiento(nuevo: NuevoMovimiento): Promise<Movimiento> {
  const { productoId, tipo, cantidad } = nuevo;

  if (tipo !== "entrada" && tipo !== "salida") {
    throw new ErrorMovimiento("Tipo de movimiento inválido.");
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new ErrorMovimiento("La cantidad debe ser mayor a 0.");
  }
  const nota = nuevo.nota?.trim() || undefined;
  if (nota && nota.length > NOTA_MAX) {
    throw new ErrorMovimiento(`La nota no puede superar ${NOTA_MAX} caracteres.`);
  }

  return db.transaction("rw", db.productos, db.movimientos, async () => {
    const producto = await db.productos.get(productoId);
    if (!producto) {
      throw new ErrorMovimiento("Producto no encontrado.");
    }
    if (tipo === "salida" && cantidad > producto.cantidad) {
      throw new ErrorMovimiento(
        `Stock insuficiente: hay ${producto.cantidad} disponibles y se intentó sacar ${cantidad}.`,
      );
    }

    const ahora = new Date().toISOString();
    const movimiento: Movimiento = {
      id: crypto.randomUUID(),
      productoId,
      tipo,
      cantidad,
      fecha: ahora,
      ...(nota ? { nota } : {}),
    };
    const nuevaCantidad =
      tipo === "entrada" ? producto.cantidad + cantidad : producto.cantidad - cantidad;

    await db.movimientos.add(movimiento);
    await db.productos.update(productoId, { cantidad: nuevaCantidad, actualizadoEn: ahora });
    return movimiento;
  });
}

/** Historial de un producto, del más reciente al más antiguo. */
export async function listarMovimientos(productoId: string): Promise<Movimiento[]> {
  const movs = await db.movimientos.where("productoId").equals(productoId).sortBy("fecha");
  return movs.reverse();
}
