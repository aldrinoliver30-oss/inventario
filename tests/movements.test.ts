import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { ErrorMovimiento, listarMovimientos, registrarMovimiento } from "@/lib/movements";
import { crearProducto, type DatosProducto } from "@/lib/products";

const datos: DatosProducto = {
  nombre: "Arroz",
  categoria: "Granos",
  unidad: "kg",
  calidad: 3,
  fechaVencimiento: "2027-06-01",
  precioCompra: 0.9,
  precioVenta: 1.3,
};

async function cantidadDe(id: string) {
  return (await db.productos.get(id))?.cantidad;
}

beforeEach(async () => {
  await db.productos.clear();
  await db.movimientos.clear();
});

describe("registrarMovimiento", () => {
  it("entrada de 5 sobre stock 10 deja 15 y queda en el historial", async () => {
    const p = await crearProducto(datos, 10);
    const mov = await registrarMovimiento({ productoId: p.id, tipo: "entrada", cantidad: 5, nota: " compra " });
    expect(await cantidadDe(p.id)).toBe(15);
    expect(mov).toMatchObject({ tipo: "entrada", cantidad: 5, nota: "compra" });
    expect(await db.movimientos.get(mov.id)).toBeDefined();
  });

  it("salida resta del stock", async () => {
    const p = await crearProducto(datos, 15);
    await registrarMovimiento({ productoId: p.id, tipo: "salida", cantidad: 15 });
    expect(await cantidadDe(p.id)).toBe(0);
  });

  it("salida de 20 sobre stock 15 se rechaza y el stock sigue en 15", async () => {
    const p = await crearProducto(datos, 15);
    await expect(
      registrarMovimiento({ productoId: p.id, tipo: "salida", cantidad: 20 }),
    ).rejects.toThrow(/Stock insuficiente/);
    expect(await cantidadDe(p.id)).toBe(15);
    expect(await db.movimientos.where("productoId").equals(p.id).count()).toBe(1);
  });

  it.each([0, -3, Number.NaN])("rechaza cantidad %s", async (cantidad) => {
    const p = await crearProducto(datos, 10);
    await expect(
      registrarMovimiento({ productoId: p.id, tipo: "entrada", cantidad }),
    ).rejects.toBeInstanceOf(ErrorMovimiento);
    expect(await cantidadDe(p.id)).toBe(10);
  });

  it("rechaza nota de más de 200 caracteres", async () => {
    const p = await crearProducto(datos, 10);
    await expect(
      registrarMovimiento({ productoId: p.id, tipo: "entrada", cantidad: 1, nota: "x".repeat(201) }),
    ).rejects.toThrow(/200/);
  });

  it("nota vacía no se guarda", async () => {
    const p = await crearProducto(datos, 10);
    const mov = await registrarMovimiento({ productoId: p.id, tipo: "entrada", cantidad: 1, nota: "   " });
    expect(mov.nota).toBeUndefined();
  });

  it("rechaza producto inexistente", async () => {
    await expect(
      registrarMovimiento({ productoId: "no-existe", tipo: "entrada", cantidad: 1 }),
    ).rejects.toThrow("Producto no encontrado.");
  });
});

describe("listarMovimientos", () => {
  it("devuelve el más reciente primero", async () => {
    const p = await crearProducto(datos, 10);
    await new Promise((r) => setTimeout(r, 5));
    await registrarMovimiento({ productoId: p.id, tipo: "salida", cantidad: 2 });
    const movs = await listarMovimientos(p.id);
    expect(movs.map((m) => m.tipo)).toEqual(["salida", "entrada"]);
  });
});
