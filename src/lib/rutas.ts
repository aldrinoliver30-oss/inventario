// Rutas fijas con ?id= para que todas las páginas se precacheen al compilar (SPEC 02).

export const rutaProducto = (id: string) => `/productos/ver?id=${encodeURIComponent(id)}`;
export const rutaEditar = (id: string) => `/productos/editar?id=${encodeURIComponent(id)}`;

/** Páginas que el service worker guarda en caché para funcionar sin internet. */
export const PAGINAS_OFFLINE = [
  "/",
  "/avisos",
  "/ajustes",
  "/productos/nuevo",
  "/productos/ver",
  "/productos/editar",
] as const;
