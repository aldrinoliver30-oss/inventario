import { db } from "./db";
import { NOTA_MAX } from "./movements";
import { UNIDADES, type Calidad, type Movimiento, type Producto, type Respaldo } from "./types";

/** Error de un respaldo inválido; su mensaje se muestra tal cual en la UI. */
export class ErrorRespaldo extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorRespaldo";
  }
}

/** Lee todos los productos y movimientos en un objeto listo para guardar como JSON. */
export async function exportarDatos(): Promise<Respaldo> {
  return db.transaction("r", db.productos, db.movimientos, async () => ({
    app: "inventario" as const,
    version: 1 as const,
    exportadoEn: new Date().toISOString(),
    productos: await db.productos.toArray(),
    movimientos: await db.movimientos.toArray(),
  }));
}

type Registro = Record<string, unknown>;

const esObjeto = (v: unknown): v is Registro =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const esNumeroNoNegativo = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const esFechaISO = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

function validarProducto(v: unknown, n: number): Producto {
  const err = (detalle: string) => new ErrorRespaldo(`Producto ${n}: ${detalle}.`);
  if (!esObjeto(v)) throw err("no es un objeto");
  if (!esTexto(v.id)) throw err("falta el id");
  if (!esTexto(v.nombre) || v.nombre.trim().length > 100) throw err("nombre inválido");
  if (!esTexto(v.categoria)) throw err("categoría inválida");
  if (!(UNIDADES as readonly unknown[]).includes(v.unidad)) throw err("unidad inválida");
  if (!Number.isInteger(v.calidad) || (v.calidad as number) < 1 || (v.calidad as number) > 5) {
    throw err("calidad inválida");
  }
  if (typeof v.fechaVencimiento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.fechaVencimiento)) {
    throw err("fecha de vencimiento inválida");
  }
  if (!esNumeroNoNegativo(v.cantidad)) throw err("cantidad inválida");
  if (!esNumeroNoNegativo(v.precioCompra)) throw err("precio de compra inválido");
  if (!esNumeroNoNegativo(v.precioVenta)) throw err("precio de venta inválido");
  if (!esFechaISO(v.creadoEn) || !esFechaISO(v.actualizadoEn)) throw err("fechas de registro inválidas");

  // Se copian solo los campos conocidos; cualquier otro se descarta.
  return {
    id: v.id,
    nombre: v.nombre,
    categoria: v.categoria,
    unidad: v.unidad as Producto["unidad"],
    calidad: v.calidad as Calidad,
    fechaVencimiento: v.fechaVencimiento,
    cantidad: v.cantidad,
    precioCompra: v.precioCompra,
    precioVenta: v.precioVenta,
    creadoEn: v.creadoEn,
    actualizadoEn: v.actualizadoEn,
  };
}

function validarMovimiento(v: unknown, n: number, idsProductos: Set<string>): Movimiento {
  const err = (detalle: string) => new ErrorRespaldo(`Movimiento ${n}: ${detalle}.`);
  if (!esObjeto(v)) throw err("no es un objeto");
  if (!esTexto(v.id)) throw err("falta el id");
  if (!esTexto(v.productoId) || !idsProductos.has(v.productoId)) {
    throw err("no corresponde a ningún producto del respaldo");
  }
  if (v.tipo !== "entrada" && v.tipo !== "salida") throw err("tipo inválido");
  if (!esNumeroNoNegativo(v.cantidad) || v.cantidad === 0) throw err("cantidad inválida");
  if (!esFechaISO(v.fecha)) throw err("fecha inválida");
  if (v.nota !== undefined && (typeof v.nota !== "string" || v.nota.length > NOTA_MAX)) {
    throw err("nota inválida");
  }

  return {
    id: v.id,
    productoId: v.productoId,
    tipo: v.tipo,
    cantidad: v.cantidad,
    fecha: v.fecha,
    ...(v.nota ? { nota: v.nota } : {}),
  };
}

/**
 * Revisa que un objeto (ya parseado desde JSON) sea un respaldo válido de esta app.
 * Lanza ErrorRespaldo con el primer problema encontrado; no toca la base.
 */
export function validarRespaldo(json: unknown): Respaldo {
  if (!esObjeto(json) || json.app !== "inventario") {
    throw new ErrorRespaldo("El archivo no es un respaldo de Inventario.");
  }
  if (json.version !== 1) {
    throw new ErrorRespaldo(`Versión de respaldo no soportada: ${String(json.version)}.`);
  }
  if (!Array.isArray(json.productos) || !Array.isArray(json.movimientos)) {
    throw new ErrorRespaldo("El respaldo no tiene listas de productos y movimientos.");
  }

  const productos = json.productos.map((p, i) => validarProducto(p, i + 1));
  const idsProductos = new Set(productos.map((p) => p.id));
  if (idsProductos.size !== productos.length) {
    throw new ErrorRespaldo("El respaldo tiene productos con id repetido.");
  }

  const movimientos = json.movimientos.map((m, i) => validarMovimiento(m, i + 1, idsProductos));
  if (new Set(movimientos.map((m) => m.id)).size !== movimientos.length) {
    throw new ErrorRespaldo("El respaldo tiene movimientos con id repetido.");
  }

  return {
    app: "inventario",
    version: 1,
    exportadoEn: typeof json.exportadoEn === "string" ? json.exportadoEn : "",
    productos,
    movimientos,
  };
}

/** Parsea el texto de un archivo .json y lo valida como respaldo. */
export function leerRespaldo(texto: string): Respaldo {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new ErrorRespaldo("El archivo no es un JSON válido.");
  }
  return validarRespaldo(json);
}

/** Reemplaza TODOS los datos actuales por los del respaldo, en una sola transacción. */
export async function importarDatos(respaldo: Respaldo): Promise<void> {
  await db.transaction("rw", db.productos, db.movimientos, async () => {
    await db.movimientos.clear();
    await db.productos.clear();
    await db.productos.bulkAdd(respaldo.productos);
    await db.movimientos.bulkAdd(respaldo.movimientos);
  });
}
