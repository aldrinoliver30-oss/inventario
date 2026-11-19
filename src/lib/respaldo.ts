import { db } from "./db";
import { UNIDADES, type Foto, type Movimiento, type Producto, type Respaldo } from "./types";

export async function exportarDatos(): Promise<Respaldo> {
  return db.transaction("r", db.productos, db.movimientos, db.fotos, async () => ({
    app: "inventario" as const,
    version: 2 as const,
    exportadoEn: new Date().toISOString(),
    productos: await db.productos.toArray(),
    movimientos: await db.movimientos.toArray(),
    fotos: await db.fotos.toArray(),
  }));
}

const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const esTexto = (v: unknown): v is string => typeof v === "string";
const esNum = (v: unknown, min = 0): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min;

function esProducto(p: unknown): p is Producto {
  return (
    esObj(p) &&
    esTexto(p.id) && p.id !== "" &&
    esTexto(p.nombre) && p.nombre.trim() !== "" &&
    esTexto(p.categoria) &&
    (UNIDADES as readonly unknown[]).includes(p.unidad) &&
    [1, 2, 3, 4, 5].includes(p.calidad as number) &&
    (p.fechaVencimiento === null ||
      (esTexto(p.fechaVencimiento) && /^\d{4}-\d{2}-\d{2}$/.test(p.fechaVencimiento))) &&
    esNum(p.cantidad) &&
    esNum(p.stockMinimo) &&
    esNum(p.precioCompra) &&
    esNum(p.precioVenta) &&
    esTexto(p.codigo) &&
    esTexto(p.lote) &&
    esTexto(p.proveedor) &&
    esTexto(p.notas) &&
    typeof p.tieneFoto === "boolean" &&
    esTexto(p.creadoEn) &&
    esTexto(p.actualizadoEn)
  );
}

function esMovimiento(m: unknown, ids: Set<string>): m is Movimiento {
  return (
    esObj(m) &&
    esTexto(m.id) &&
    esTexto(m.productoId) && ids.has(m.productoId) &&
    (m.tipo === "entrada" || m.tipo === "salida") &&
    esNum(m.cantidad) && m.cantidad > 0 &&
    esTexto(m.fecha) &&
    (m.nota === undefined || esTexto(m.nota))
  );
}

function esFoto(f: unknown, ids: Set<string>): f is Foto {
  return (
    esObj(f) &&
    esTexto(f.productoId) && ids.has(f.productoId) &&
    esTexto(f.dataUrl) && f.dataUrl.startsWith("data:image/")
  );
}

/** Lanza un Error con mensaje legible si el JSON no es un respaldo válido. */
export function validarRespaldo(json: unknown): Respaldo {
  if (!esObj(json) || json.app !== "inventario") {
    throw new Error("El archivo no es un respaldo de esta app.");
  }
  if (json.version !== 2) {
    throw new Error("Versión de respaldo no compatible (se esperaba la versión 2).");
  }
  const { productos, movimientos, fotos } = json;
  if (!Array.isArray(productos) || !Array.isArray(movimientos) || !Array.isArray(fotos)) {
    throw new Error("El respaldo está incompleto.");
  }
  const malP = productos.findIndex((p) => !esProducto(p));
  if (malP >= 0) throw new Error(`Producto inválido en la posición ${malP + 1}.`);
  const ids = new Set((productos as Producto[]).map((p) => p.id));
  if (ids.size !== productos.length) throw new Error("Hay productos con id repetido.");
  const malM = movimientos.findIndex((m) => !esMovimiento(m, ids));
  if (malM >= 0) throw new Error(`Movimiento inválido en la posición ${malM + 1}.`);
  const malF = fotos.findIndex((f) => !esFoto(f, ids));
  if (malF >= 0) throw new Error(`Foto inválida en la posición ${malF + 1}.`);

  return json as unknown as Respaldo;
}

/** Reemplaza todos los datos por los del respaldo, en una sola transacción. */
export async function importarDatos(respaldo: Respaldo): Promise<void> {
  const conFoto = new Set(respaldo.fotos.map((f) => f.productoId));
  const productos = respaldo.productos.map((p) => ({ ...p, tieneFoto: conFoto.has(p.id) }));
  await db.transaction("rw", db.productos, db.movimientos, db.fotos, async () => {
    await Promise.all([db.productos.clear(), db.movimientos.clear(), db.fotos.clear()]);
    await db.productos.bulkAdd(productos);
    await db.movimientos.bulkAdd(respaldo.movimientos);
    await db.fotos.bulkAdd(respaldo.fotos);
  });
}

export function nombreArchivoRespaldo(hoy: string): string {
  return `inventario-${hoy}.json`;
}
