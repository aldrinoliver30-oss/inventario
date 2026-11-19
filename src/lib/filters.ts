import { getEstadoVencimiento } from "./expiry";
import type { Calidad, EstadoVencimiento, Producto } from "./types";

export interface FiltrosProductos {
  busqueda: string;
  /** "" = todas las categorías. */
  categoria: string;
  /** 0 = cualquier calidad. */
  calidadMinima: Calidad | 0;
  /** null = todos los estados. */
  estado: EstadoVencimiento | null;
}

export const FILTROS_VACIOS: FiltrosProductos = {
  busqueda: "",
  categoria: "",
  calidadMinima: 0,
  estado: null,
};

export function hayFiltrosActivos(f: FiltrosProductos): boolean {
  return f.busqueda.trim() !== "" || f.categoria !== "" || f.calidadMinima !== 0 || f.estado !== null;
}

/** Minúsculas y sin tildes, para comparar texto sin distinguir mayúsculas ni acentos. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Aplica todos los filtros a la vez (se combinan con Y). Conserva el orden de entrada. */
export function filtrarProductos(
  productos: Producto[],
  f: FiltrosProductos,
  hoy: Date = new Date(),
): Producto[] {
  const busqueda = normalizar(f.busqueda);
  return productos.filter(
    (p) =>
      (busqueda === "" || normalizar(p.nombre).includes(busqueda)) &&
      (f.categoria === "" || p.categoria === f.categoria) &&
      p.calidad >= f.calidadMinima &&
      (f.estado === null || getEstadoVencimiento(p.fechaVencimiento, hoy) === f.estado),
  );
}
