import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { ErrorMovimiento, registrarMovimiento } from "@/lib/movimientos";
import { actualizarProducto, crearProducto, eliminarProducto } from "@/lib/productos";
import { exportarDatos, importarDatos, validarRespaldo } from "@/lib/respaldo";
import { datosProducto } from "./helpers";

const FOTO = "data:image/jpeg;base64,AAAA";

beforeEach(async () => {
  await Promise.all([db.productos.clear(), db.movimientos.clear(), db.fotos.clear()]);
});

describe("productos", () => {
  it("crear con cantidad 10 genera movimiento 'Stock inicial' y guarda la foto", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }), FOTO);
    const movs = await db.movimientos.where("productoId").equals(id).toArray();
    expect(movs).toHaveLength(1);
    expect(movs[0]).toMatchObject({ tipo: "entrada", cantidad: 10, nota: "Stock inicial" });
    expect((await db.productos.get(id))?.tieneFoto).toBe(true);
    expect((await db.fotos.get(id))?.dataUrl).toBe(FOTO);
  });

  it("crear con cantidad 0 no genera movimientos", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 0 }));
    expect(await db.movimientos.where("productoId").equals(id).count()).toBe(0);
  });

  it("editar no cambia la cantidad y puede quitar la foto", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }), FOTO);
    await actualizarProducto(id, { ...datosProducto({ nombre: "Nuevo", cantidad: 999 }) }, null);
    const p = await db.productos.get(id);
    expect(p?.nombre).toBe("Nuevo");
    expect(p?.cantidad).toBe(10);
    expect(p?.tieneFoto).toBe(false);
    expect(await db.fotos.get(id)).toBeUndefined();
  });

  it("eliminar borra producto, movimientos y foto", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }), FOTO);
    await eliminarProducto(id);
    expect(await db.productos.count()).toBe(0);
    expect(await db.movimientos.count()).toBe(0);
    expect(await db.fotos.count()).toBe(0);
  });
});

describe("registrarMovimiento", () => {
  it("entrada de 5 sobre 10 deja 15", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }));
    const r = await registrarMovimiento({ productoId: id, tipo: "entrada", cantidad: 5 });
    expect(r.producto.cantidad).toBe(15);
    expect(await db.movimientos.where("productoId").equals(id).count()).toBe(2);
  });

  it("salida mayor al stock se rechaza y no cambia nada", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 15 }));
    await expect(registrarMovimiento({ productoId: id, tipo: "salida", cantidad: 20 })).rejects.toThrow(
      ErrorMovimiento,
    );
    expect((await db.productos.get(id))?.cantidad).toBe(15);
    expect(await db.movimientos.where("productoId").equals(id).count()).toBe(1);
  });

  it("informa el cambio de estado de stock (ok → bajo → agotado)", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10, stockMinimo: 3 }));
    const r1 = await registrarMovimiento({ productoId: id, tipo: "salida", cantidad: 7 });
    expect([r1.antes, r1.despues]).toEqual(["ok", "bajo"]);
    const r2 = await registrarMovimiento({ productoId: id, tipo: "salida", cantidad: 3 });
    expect([r2.antes, r2.despues]).toEqual(["bajo", "agotado"]);
  });

  it("rechaza cantidades no válidas", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }));
    await expect(registrarMovimiento({ productoId: id, tipo: "entrada", cantidad: 0 })).rejects.toThrow();
    await expect(registrarMovimiento({ productoId: id, tipo: "entrada", cantidad: 1.5 })).rejects.toThrow(/entero/);
  });

  it("evita errores de coma flotante en kg", async () => {
    const id = await crearProducto(datosProducto({ unidad: "kg", cantidad: 0.1 }));
    const r = await registrarMovimiento({ productoId: id, tipo: "entrada", cantidad: 0.2 });
    expect(r.producto.cantidad).toBe(0.3);
  });
});

describe("respaldo", () => {
  it("exportar e importar restaura exactamente los datos", async () => {
    const id = await crearProducto(datosProducto({ cantidad: 10 }), FOTO);
    await registrarMovimiento({ productoId: id, tipo: "salida", cantidad: 4, nota: "Venta" });
    const respaldo = await exportarDatos();
    const json = JSON.parse(JSON.stringify(respaldo));

    await Promise.all([db.productos.clear(), db.movimientos.clear(), db.fotos.clear()]);
    await importarDatos(validarRespaldo(json));

    const despues = await exportarDatos();
    expect(despues.productos).toEqual(respaldo.productos);
    expect(despues.movimientos).toEqual(respaldo.movimientos);
    expect(despues.fotos).toEqual(respaldo.fotos);
  });

  it("rechaza archivos inválidos sin tocar los datos", async () => {
    await crearProducto(datosProducto());
    expect(() => validarRespaldo({ app: "otra" })).toThrow();
    expect(() => validarRespaldo({ app: "inventario", version: 1, productos: [], movimientos: [] })).toThrow(/versión/i);
    expect(() =>
      validarRespaldo({ app: "inventario", version: 2, productos: [{ id: "x" }], movimientos: [], fotos: [] }),
    ).toThrow(/Producto inválido/);
    const huerfano = { id: "m", productoId: "nope", tipo: "entrada", cantidad: 1, fecha: "x" };
    expect(() =>
      validarRespaldo({ app: "inventario", version: 2, productos: [], movimientos: [huerfano], fotos: [] }),
    ).toThrow(/Movimiento inválido/);
    expect(await db.productos.count()).toBe(1);
  });
});
