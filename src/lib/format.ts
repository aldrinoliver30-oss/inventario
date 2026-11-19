const formatoPrecio = new Intl.NumberFormat("es", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoCantidad = new Intl.NumberFormat("es", { maximumFractionDigits: 3 });

/** Precio con 2 decimales, sin símbolo de moneda. */
export function formatearPrecio(valor: number): string {
  return formatoPrecio.format(valor);
}

export function formatearCantidad(valor: number): string {
  return formatoCantidad.format(valor);
}

/** "YYYY-MM-DD" → "DD/MM/YYYY", sin pasar por Date (evita desfases de zona horaria). */
export function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

const formatoFechaHora = new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" });

/** Fecha y hora local de un ISO 8601 (para el historial de movimientos). */
export function formatearFechaHora(iso: string): string {
  return formatoFechaHora.format(new Date(iso));
}
