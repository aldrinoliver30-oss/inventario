import { estadoStock, estadoVencimiento, hoyISO } from "./estados";
import { normalizar } from "./formato";
import type { EstadoStock, EstadoVencimiento, Producto } from "./types";

export interface Filtros {
  texto: string;
  categoria: string;
  calidadMin: number;
  stock: "" | EstadoStock;
  vencimiento: "" | EstadoVencimiento;
}

export const FILTROS_VACIOS: Filtros = {
  texto: "",
  categoria: "",
  calidadMin: 0,
  stock: "",
  vencimiento: "",
};

export function hayFiltros(f: Filtros): boolean {
  return (
    f.texto.trim() !== "" ||
    f.categoria !== "" ||
    f.calidadMin > 0 ||
    f.stock !== "" ||
    f.vencimiento !== ""
  );
}

export function filtrarProductos(productos: Producto[], f: Filtros, hoy: string = hoyISO()): Producto[] {
  const q = normalizar(f.texto);
  return productos.filter((p) => {
    if (q && !normalizar(p.nombre).includes(q) && !normalizar(p.codigo).includes(q)) return false;
    if (f.categoria && p.categoria !== f.categoria) return false;
    if (p.calidad < f.calidadMin) return false;
    if (f.stock && estadoStock(p) !== f.stock) return false;
    if (f.vencimiento && estadoVencimiento(p.fechaVencimiento, hoy) !== f.vencimiento) return false;
    return true;
  });
}

const PRIORIDAD_STOCK: Record<EstadoStock, number> = { agotado: 0, bajo: 1, ok: 2 };

/** Primero agotados y stock bajo; luego vencimiento más próximo; luego nombre. */
export function ordenarProductos(productos: Producto[]): Producto[] {
  return [...productos].sort((a, b) => {
    const s = PRIORIDAD_STOCK[estadoStock(a)] - PRIORIDAD_STOCK[estadoStock(b)];
    if (s !== 0) return s;
    const fa = a.fechaVencimiento ?? "9999-12-31";
    const fb = b.fechaVencimiento ?? "9999-12-31";
    if (fa !== fb) return fa < fb ? -1 : 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}
