const precio = new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cantidad = new Intl.NumberFormat("es", { maximumFractionDigits: 3 });

export const formatearPrecio = (n: number) => precio.format(n);
export const formatearCantidad = (n: number) => cantidad.format(n);

/** "2026-11-19" → "19 nov 2026", sin desfase de zona horaria. */
export function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Minúsculas y sin tildes, para búsquedas. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
