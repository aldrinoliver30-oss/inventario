import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("db", () => {
  it("abre la base 'inventario' versión 1 con sus tablas", async () => {
    await db.open();
    expect(db.name).toBe("inventario");
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name).sort()).toEqual(["movimientos", "productos"]);
  });
});
