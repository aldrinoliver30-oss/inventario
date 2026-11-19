export const UNIDADES = ["unidad", "caja", "paquete", "kg", "g", "litro", "ml"] as const;
export type Unidad = (typeof UNIDADES)[number];

export type Calidad = 1 | 2 | 3 | 4 | 5;

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  unidad: Unidad;
  calidad: Calidad;
  /** "YYYY-MM-DD" o null si el producto no vence. */
  fechaVencimiento: string | null;
  /** Solo cambia mediante movimientos. */
  cantidad: number;
  /** 0 = solo avisa cuando se agota. */
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  codigo: string;
  lote: string;
  proveedor: string;
  notas: string;
  tieneFoto: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoMovimiento = "entrada" | "salida";

export interface Movimiento {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  nota?: string;
}

export interface Foto {
  productoId: string;
  dataUrl: string;
}

export type EstadoStock = "agotado" | "bajo" | "ok";
export type EstadoVencimiento = "vencido" | "por-vencer" | "ok" | "sin-fecha";

export interface Respaldo {
  app: "inventario";
  version: 2;
  exportadoEn: string;
  productos: Producto[];
  movimientos: Movimiento[];
  fotos: Foto[];
}

/** Datos que el usuario edita en el formulario (sin campos calculados). */
export type DatosProducto = Omit<Producto, "id" | "tieneFoto" | "creadoEn" | "actualizadoEn">;
