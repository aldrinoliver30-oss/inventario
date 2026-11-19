import Dexie, { type EntityTable } from "dexie";
import type { Foto, Movimiento, Producto } from "./types";

/** Base separada de la v1 ("inventario") para no mezclar esquemas. */
export const DB_NOMBRE = "inventario-v2";

export const db = new Dexie(DB_NOMBRE) as Dexie & {
  productos: EntityTable<Producto, "id">;
  movimientos: EntityTable<Movimiento, "id">;
  fotos: EntityTable<Foto, "productoId">;
};

db.version(1).stores({
  productos: "id, nombre, categoria, fechaVencimiento",
  movimientos: "id, productoId, fecha",
  fotos: "productoId",
});
