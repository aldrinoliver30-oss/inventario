import { UNIDADES, type DatosProducto, type Unidad } from "./types";

/** Valores crudos del formulario. */
export interface FormularioProducto {
  nombre: string;
  categoria: string;
  unidad: string;
  calidad: number;
  fechaVencimiento: string;
  cantidad: string;
  stockMinimo: string;
  precioCompra: string;
  precioVenta: string;
  codigo: string;
  lote: string;
  proveedor: string;
  notas: string;
}

export type ErroresProducto = Partial<Record<keyof FormularioProducto, string>>;

export const FORMULARIO_VACIO: FormularioProducto = {
  nombre: "",
  categoria: "",
  unidad: "unidad",
  calidad: 0,
  fechaVencimiento: "",
  cantidad: "",
  stockMinimo: "",
  precioCompra: "",
  precioVenta: "",
  codigo: "",
  lote: "",
  proveedor: "",
  notas: "",
};

const UNIDADES_CON_DECIMALES: ReadonlySet<Unidad> = new Set(["kg", "g", "litro", "ml"]);

export function admiteDecimales(unidad: string): boolean {
  return UNIDADES_CON_DECIMALES.has(unidad as Unidad);
}

/** Convierte texto a número (acepta coma decimal). Vacío = 0. */
export function leerNumero(valor: string): number {
  const limpio = valor.trim().replace(",", ".");
  return limpio === "" ? 0 : Number(limpio);
}

/** Devuelve un mensaje de error o null. */
export function errorNumero(n: number, campo: string, decimales: boolean): string | null {
  if (!Number.isFinite(n)) return `${campo} debe ser un número.`;
  if (n < 0) return `${campo} no puede ser negativo.`;
  if (!decimales && !Number.isInteger(n)) return `${campo} debe ser un número entero.`;
  return null;
}

export function validarProducto(
  f: FormularioProducto,
): { ok: true; datos: DatosProducto } | { ok: false; errores: ErroresProducto } {
  const e: ErroresProducto = {};
  const nombre = f.nombre.trim();
  const categoria = f.categoria.trim();

  if (!nombre) e.nombre = "El nombre es obligatorio.";
  else if (nombre.length > 100) e.nombre = "Máximo 100 caracteres.";
  if (!categoria) e.categoria = "La categoría es obligatoria.";
  if (!(UNIDADES as readonly string[]).includes(f.unidad)) e.unidad = "Elige una unidad.";
  if (![1, 2, 3, 4, 5].includes(f.calidad)) e.calidad = "Elige una calidad de 1 a 5 estrellas.";
  if (f.fechaVencimiento && !/^\d{4}-\d{2}-\d{2}$/.test(f.fechaVencimiento)) {
    e.fechaVencimiento = "Fecha inválida.";
  }
  if (f.notas.length > 1000) e.notas = "Máximo 1000 caracteres.";

  const dec = admiteDecimales(f.unidad);
  const numeros = {
    cantidad: [leerNumero(f.cantidad), "La cantidad", dec],
    stockMinimo: [leerNumero(f.stockMinimo), "El stock mínimo", dec],
    precioCompra: [leerNumero(f.precioCompra), "El precio de compra", true],
    precioVenta: [leerNumero(f.precioVenta), "El precio de venta", true],
  } as const;
  for (const [clave, [n, campo, decimales]] of Object.entries(numeros)) {
    const err = errorNumero(n, campo, decimales);
    if (err) e[clave as keyof ErroresProducto] = err;
  }

  if (Object.keys(e).length > 0) return { ok: false, errores: e };

  const redondear = (n: number) => Math.round(n * 100) / 100;
  return {
    ok: true,
    datos: {
      nombre,
      categoria,
      unidad: f.unidad as Unidad,
      calidad: f.calidad as DatosProducto["calidad"],
      fechaVencimiento: f.fechaVencimiento || null,
      cantidad: numeros.cantidad[0],
      stockMinimo: numeros.stockMinimo[0],
      precioCompra: redondear(numeros.precioCompra[0]),
      precioVenta: redondear(numeros.precioVenta[0]),
      codigo: f.codigo.trim(),
      lote: f.lote.trim(),
      proveedor: f.proveedor.trim(),
      notas: f.notas.trim(),
    },
  };
}
