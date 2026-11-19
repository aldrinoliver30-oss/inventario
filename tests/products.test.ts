import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarCategorias,
  NOTA_STOCK_INICIAL,
  type DatosProducto,
} from "@/lib/products";

const datos: DatosProducto = {
  nombre: "Leche Entera",
  categoria: "Lácteos",
  unidad: "litro",
  calidad: 4,
  fechaVencimiento: "2026-12-01",
  precioCompra: 1.2,
  precioVenta: 1.8,
};

beforeEach(async () => {
  await db.productos.clear();
  await db.movimientos.clear();
});

describe("crearProducto", () => {
  it("guarda el producto con id, fechas y cantidad", async () => {
    const p = await crearProducto(datos, 10);
    const guardado = await db.productos.get(p.id);
    expect(guardado).toMatchObject({ ...datos, cantidad: 10 });
    expect(guardado?.creadoEn).toBe(guardado?.actualizadoEn);
  });

  it("con cantidad 10 genera una entrada de 10 'Stock inicial'", async () => {
    const p = await crearProducto(datos, 10);
    const movs = await db.movimientos.where("productoId").equals(p.id).toArray();
    expect(movs).toHaveLength(1);
    expect(movs[0]).toMatchObject({ tipo: "entrada", cantidad: 10, nota: NOTA_STOCK_INICIAL });
  });

  it("con cantidad 0 no genera movimientos", async () => {
    const p = await crearProducto(datos, 0);
    expect(await db.movimientos.where("productoId").equals(p.id).count()).toBe(0);
  });

  it("rechaza cantidad negativa y no guarda nada", async () => {
    await expect(crearProducto(datos, -1)).rejects.toThrow();
    expect(await db.productos.count()).toBe(0);
  });
});

describe("actualizarProducto", () => {
  it("cambia los datos pero no la cantidad", async () => {
    const p = await crearProducto(datos, 10);
    const conCantidad = { ...datos, nombre: "Leche Descremada", cantidad: 999 } as DatosProducto;
    await actualizarProducto(p.id, conCantidad);
    const guardado = await db.productos.get(p.id);
    expect(guardado?.nombre).toBe("Leche Descremada");
    expect(guardado?.cantidad).toBe(10);
  });

  it("falla si el producto no existe", async () => {
    await expect(actualizarProducto("no-existe", datos)).rejects.toThrow("Producto no encontrado.");
  });
});

describe("eliminarProducto", () => {
  it("borra el producto y sus movimientos, pero no los de otros", async () => {
    const a = await crearProducto(datos, 10);
    const b = await crearProducto({ ...datos, nombre: "Yogur" }, 5);
    await eliminarProducto(a.id);
    expect(await db.productos.get(a.id)).toBeUndefined();
    expect(await db.movimientos.where("productoId").equals(a.id).count()).toBe(0);
    expect(await db.productos.get(b.id)).toBeDefined();
    expect(await db.movimientos.where("productoId").equals(b.id).count()).toBe(1);
  });
});

describe("listarCategorias", () => {
  it("devuelve categorías únicas en orden alfabético", async () => {
    await crearProducto({ ...datos, categoria: "Lácteos" }, 0);
    await crearProducto({ ...datos, categoria: "Bebidas" }, 0);
    await crearProducto({ ...datos, categoria: "Lácteos" }, 0);
    expect(await listarCategorias()).toEqual(["Bebidas", "Lácteos"]);
  });
});
