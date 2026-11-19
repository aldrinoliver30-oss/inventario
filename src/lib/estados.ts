import type { EstadoStock, EstadoVencimiento, Producto } from "./types";

export const DIAS_ALERTA = 30;

/** Fecha local de hoy como "YYYY-MM-DD". */
export function hoyISO(ahora: Date = new Date()): string {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function aDia(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Días desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(fecha: string, hoy: string = hoyISO()): number {
  return Math.round(aDia(fecha) - aDia(hoy));
}

export function estadoVencimiento(fecha: string | null, hoy: string = hoyISO()): EstadoVencimiento {
  if (!fecha) return "sin-fecha";
  const dias = diasHasta(fecha, hoy);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_ALERTA) return "por-vencer";
  return "ok";
}

export function estadoStock(p: Pick<Producto, "cantidad" | "stockMinimo">): EstadoStock {
  if (p.cantidad <= 0) return "agotado";
  if (p.cantidad <= p.stockMinimo) return "bajo";
  return "ok";
}

/** ¿Hay que avisar tras pasar de `antes` a `despues`? */
export function debeAvisarStock(antes: EstadoStock, despues: EstadoStock): boolean {
  if (despues === "agotado") return true;
  return despues === "bajo" && antes === "ok";
}

export interface ResumenAvisos {
  agotados: Producto[];
  bajos: Producto[];
  vencidos: Producto[];
  porVencer: Producto[];
  /** Productos distintos que necesitan atención. */
  total: number;
}

export function resumenAvisos(productos: Producto[], hoy: string = hoyISO()): ResumenAvisos {
  const r: ResumenAvisos = { agotados: [], bajos: [], vencidos: [], porVencer: [], total: 0 };
  for (const p of productos) {
    const s = estadoStock(p);
    const v = estadoVencimiento(p.fechaVencimiento, hoy);
    if (s === "agotado") r.agotados.push(p);
    if (s === "bajo") r.bajos.push(p);
    if (v === "vencido") r.vencidos.push(p);
    if (v === "por-vencer") r.porVencer.push(p);
    if (s !== "ok" || v === "vencido" || v === "por-vencer") r.total++;
  }
  return r;
}
