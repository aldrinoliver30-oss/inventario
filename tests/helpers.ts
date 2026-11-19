import type { DatosProducto, Producto } from "@/lib/types";

export function datosProducto(extra: Partial<DatosProducto> = {}): DatosProducto {
  return {
    nombre: "Leche Entera",
    categoria: "Lácteos",
    unidad: "unidad",
    calidad: 4,
    fechaVencimiento: "2030-01-01",
    cantidad: 10,
    stockMinimo: 3,
    precioCompra: 1,
    precioVenta: 1.5,
    codigo: "LE-001",
    lote: "L42",
    proveedor: "Lácteos del Sur",
    notas: "Mantener refrigerado",
    ...extra,
  };
}

export function producto(extra: Partial<Producto> = {}): Producto {
  return {
    ...datosProducto(),
    id: crypto.randomUUID(),
    tieneFoto: false,
    creadoEn: "2026-01-01T00:00:00.000Z",
    actualizadoEn: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}
