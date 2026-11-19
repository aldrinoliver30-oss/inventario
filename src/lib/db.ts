import Dexie, { type EntityTable } from "dexie";
import type { Movimiento, Producto } from "./types";

export const DB_NOMBRE = "inventario";

export const db = new Dexie(DB_NOMBRE) as Dexie & {
  productos: EntityTable<Producto, "id">;
  movimientos: EntityTable<Movimiento, "id">;
};

db.version(1).stores({
  productos: "id, nombre, categoria, calidad, fechaVencimiento",
  movimientos: "id, productoId, fecha",
});
