import type { EstadoVencimiento } from "./types";

/** Días de anticipación para marcar un producto como "por vencer". */
export const DIAS_ALERTA = 30;

/** Fecha local (no UTC) en formato "YYYY-MM-DD". */
export function fechaLocalISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Suma días a una fecha según el calendario local. */
export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/**
 * Estado de vencimiento comparando solo fechas en hora local:
 * - "vencido" si fechaVencimiento < hoy
 * - "por-vencer" si hoy <= fechaVencimiento <= hoy + DIAS_ALERTA
 * - "ok" en otro caso
 */
export function getEstadoVencimiento(
  fechaVencimiento: string,
  hoy: Date = new Date(),
): EstadoVencimiento {
  // Las fechas "YYYY-MM-DD" se comparan correctamente como texto.
  const hoyISO = fechaLocalISO(hoy);
  const limiteISO = fechaLocalISO(sumarDias(hoy, DIAS_ALERTA));
  if (fechaVencimiento < hoyISO) return "vencido";
  if (fechaVencimiento <= limiteISO) return "por-vencer";
  return "ok";
}

/** Cuenta cuántos productos hay en cada estado de vencimiento. */
export function contarPorEstado(
  productos: { fechaVencimiento: string }[],
  hoy: Date = new Date(),
): Record<EstadoVencimiento, number> {
  const conteo: Record<EstadoVencimiento, number> = { vencido: 0, "por-vencer": 0, ok: 0 };
  for (const p of productos) conteo[getEstadoVencimiento(p.fechaVencimiento, hoy)]++;
  return conteo;
}
