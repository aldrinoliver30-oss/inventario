export const UNIDADES = ["unidad", "caja", "paquete", "kg", "g", "litro", "ml"] as const;
export type Unidad = (typeof UNIDADES)[number];

export type Calidad = 1 | 2 | 3 | 4 | 5;

export interface Producto {
  id: string; // crypto.randomUUID()
  nombre: string; // obligatorio, 1–100 caracteres
  categoria: string; // texto libre obligatorio
  unidad: Unidad;
  calidad: Calidad;
  fechaVencimiento: string; // "YYYY-MM-DD"
  cantidad: number; // >= 0; solo cambia vía movimientos
  precioCompra: number; // >= 0, moneda local, 2 decimales
  precioVenta: number; // >= 0, moneda local, 2 decimales
  creadoEn: string; // ISO 8601
  actualizadoEn: string; // ISO 8601
}

export type TipoMovimiento = "entrada" | "salida";

export interface Movimiento {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number; // > 0
  fecha: string; // ISO 8601
  nota?: string; // máx. 200 caracteres
}

export type EstadoVencimiento = "vencido" | "por-vencer" | "ok";

export interface Respaldo {
  app: "inventario";
  version: 1;
  exportadoEn: string; // ISO 8601
  productos: Producto[];
  movimientos: Movimiento[];
}
