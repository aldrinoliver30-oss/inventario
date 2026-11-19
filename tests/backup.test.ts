import { beforeEach, describe, expect, it } from "vitest";
import {
  ErrorRespaldo,
  exportarDatos,
  importarDatos,
  leerRespaldo,
  validarRespaldo,
} from "@/lib/backup";
import { db } from "@/lib/db";
import { registrarMovimiento } from "@/lib/movements";
import { crearProducto, type DatosProducto } from "@/lib/products";

const datos: DatosProducto = {
  nombre: "Leche Entera",
  categoria: "Lácteos",
  unidad: "litro",
  calidad: 4,
  fechaVencimiento: "2026-12-01",
  precioCompra: 1.2,
  precioVenta: 1.8,
};

async function limpiar() {
  await db.productos.clear();
  await db.movimientos.clear();
}

async function sembrar() {
  const a = await crearProducto(datos, 10);
  await registrarMovimiento({ productoId: a.id, tipo: "salida", cantidad: 3, nota: "venta" });
  await crearProducto({ ...datos, nombre: "Arroz", unidad: "kg", calidad: 2 }, 0);
}

beforeEach(limpiar);

describe("exportarDatos", () => {
  it("incluye app, versión, productos y movimientos", async () => {
    await sembrar();
    const r = await exportarDatos();
    expect(r.app).toBe("inventario");
    expect(r.version).toBe(1);
    expect(r.productos).toHaveLength(2);
    expect(r.movimientos).toHaveLength(2);
    expect(Number.isNaN(Date.parse(r.exportadoEn))).toBe(false);
  });
});

describe("exportar → importar", () => {
  it("restaura exactamente los mismos datos en una base limpia", async () => {
    await sembrar();
    const productosAntes = await db.productos.orderBy("id").toArray();
    const movimientosAntes = await db.movimientos.orderBy("id").toArray();
    // Simula el archivo descargado.
    const texto = JSON.stringify(await exportarDatos());

    await limpiar();
    await importarDatos(leerRespaldo(texto));

    expect(await db.productos.orderBy("id").toArray()).toEqual(productosAntes);
    expect(await db.movimientos.orderBy("id").toArray()).toEqual(movimientosAntes);
  });

  it("importar reemplaza los datos existentes (no fusiona)", async () => {
    await sembrar();
    const texto = JSON.stringify(await exportarDatos());
    await crearProducto({ ...datos, nombre: "Extra" }, 1);

    await importarDatos(leerRespaldo(texto));
    expect(await db.productos.count()).toBe(2);
    expect(await db.productos.where("nombre").equals("Extra").count()).toBe(0);
  });
});

describe("validarRespaldo / leerRespaldo", () => {
  async function respaldoValido() {
    await sembrar();
    return JSON.parse(JSON.stringify(await exportarDatos()));
  }

  it("rechaza texto que no es JSON", () => {
    expect(() => leerRespaldo("no es json")).toThrow("El archivo no es un JSON válido.");
  });

  it.each([null, [], {}, { app: "otra" }])("rechaza %j como respaldo", (json) => {
    expect(() => validarRespaldo(json)).toThrow(ErrorRespaldo);
  });

  it("rechaza versión distinta de 1", async () => {
    const r = await respaldoValido();
    expect(() => validarRespaldo({ ...r, version: 2 })).toThrow(/Versión/);
  });

  it.each([
    ["calidad", 7],
    ["unidad", "tonelada"],
    ["cantidad", -1],
    ["fechaVencimiento", "01/12/2026"],
    ["nombre", ""],
  ])("rechaza producto con %s inválido", async (campo, valor) => {
    const r = await respaldoValido();
    r.productos[0][campo] = valor;
    expect(() => validarRespaldo(r)).toThrow(/^Producto 1:/);
  });

  it("rechaza movimiento de un producto que no está en el respaldo", async () => {
    const r = await respaldoValido();
    r.movimientos[0].productoId = "otro";
    expect(() => validarRespaldo(r)).toThrow(/no corresponde/);
  });

  it("rechaza ids de producto repetidos", async () => {
    const r = await respaldoValido();
    r.productos[1].id = r.productos[0].id;
    expect(() => validarRespaldo(r)).toThrow(/repetido/);
  });

  it("descarta campos desconocidos", async () => {
    const r = await respaldoValido();
    r.productos[0].extra = "x";
    expect(validarRespaldo(r).productos[0]).not.toHaveProperty("extra");
  });

  it("un archivo inválido no modifica los datos existentes", async () => {
    await sembrar();
    const antes = await db.productos.count();
    expect(() => leerRespaldo('{"app":"inventario","version":1,"productos":[{}],"movimientos":[]}')).toThrow();
    expect(await db.productos.count()).toBe(antes);
  });
});
