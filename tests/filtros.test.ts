import { describe, expect, it } from "vitest";
import { FILTROS_VACIOS, filtrarProductos, hayFiltros, ordenarProductos } from "@/lib/filtros";
import { producto } from "./helpers";

const HOY = "2026-11-19";

describe("filtrarProductos", () => {
  const leche = producto({ nombre: "Leche Entera", codigo: "LE-001", categoria: "Lácteos", calidad: 4 });
  const leche2 = producto({ nombre: "LECHÉ", codigo: "", categoria: "Lácteos", calidad: 2, cantidad: 0 });
  const arroz = producto({ nombre: "Arroz", codigo: "AR-9", categoria: "Granos", calidad: 5, fechaVencimiento: "2026-11-01" });
  const todos = [leche, leche2, arroz];

  it("busca sin distinguir mayúsculas ni tildes", () => {
    const r = filtrarProductos(todos, { ...FILTROS_VACIOS, texto: "leche" }, HOY);
    expect(r.map((p) => p.nombre)).toEqual(["Leche Entera", "LECHÉ"]);
  });

  it("busca por código", () => {
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, texto: "ar-9" }, HOY)).toEqual([arroz]);
  });

  it("combina categoría, calidad, stock y vencimiento", () => {
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, categoria: "Lácteos", calidadMin: 3 }, HOY)).toEqual([leche]);
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, stock: "agotado" }, HOY)).toEqual([leche2]);
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, vencimiento: "vencido" }, HOY)).toEqual([arroz]);
  });

  it("hayFiltros", () => {
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false);
    expect(hayFiltros({ ...FILTROS_VACIOS, stock: "bajo" })).toBe(true);
  });
});

describe("ordenarProductos", () => {
  it("agotados y bajos primero, luego vencimiento, sin fecha al final", () => {
    const a = producto({ nombre: "A", cantidad: 50, fechaVencimiento: null });
    const b = producto({ nombre: "B", cantidad: 50, fechaVencimiento: "2027-01-01" });
    const c = producto({ nombre: "C", cantidad: 0 });
    const d = producto({ nombre: "D", cantidad: 2, stockMinimo: 5 });
    expect(ordenarProductos([a, b, c, d]).map((p) => p.nombre)).toEqual(["C", "D", "B", "A"]);
  });
});
