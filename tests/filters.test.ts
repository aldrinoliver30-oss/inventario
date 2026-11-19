import { describe, expect, it } from "vitest";
import {
  FILTROS_VACIOS,
  filtrarProductos,
  hayFiltrosActivos,
  normalizar,
} from "@/lib/filters";
import type { Producto } from "@/lib/types";

const HOY = new Date(2026, 10, 19);

function producto(parcial: Partial<Producto>): Producto {
  return {
    id: crypto.randomUUID(),
    nombre: "X",
    categoria: "General",
    unidad: "unidad",
    calidad: 3,
    fechaVencimiento: "2027-06-01",
    cantidad: 1,
    precioCompra: 0,
    precioVenta: 0,
    creadoEn: "",
    actualizadoEn: "",
    ...parcial,
  };
}

const leche = producto({ nombre: "Leche Entera", categoria: "Lácteos", calidad: 5, fechaVencimiento: "2026-11-18" });
const leche2 = producto({ nombre: "LECHÉ", categoria: "Lácteos", calidad: 2, fechaVencimiento: "2026-12-01" });
const arroz = producto({ nombre: "Arroz", categoria: "Granos", calidad: 4, fechaVencimiento: "2027-06-01" });
const todos = [leche, leche2, arroz];

describe("normalizar", () => {
  it("quita mayúsculas y tildes", () => {
    expect(normalizar("  LÉCHÉ Ñandú ")).toBe("leche nandu");
  });
});

describe("filtrarProductos", () => {
  it("sin filtros devuelve todo en el mismo orden", () => {
    expect(filtrarProductos(todos, FILTROS_VACIOS, HOY)).toEqual(todos);
  });

  it("'leche' encuentra 'Leche Entera' y 'LECHÉ'", () => {
    const r = filtrarProductos(todos, { ...FILTROS_VACIOS, busqueda: "leche" }, HOY);
    expect(r).toEqual([leche, leche2]);
  });

  it("filtra por categoría", () => {
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, categoria: "Granos" }, HOY)).toEqual([arroz]);
  });

  it("filtra por calidad mínima (incluye el valor)", () => {
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, calidadMinima: 4 }, HOY)).toEqual([leche, arroz]);
  });

  it("filtra por estado de vencimiento", () => {
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, estado: "vencido" }, HOY)).toEqual([leche]);
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, estado: "por-vencer" }, HOY)).toEqual([leche2]);
    expect(filtrarProductos(todos, { ...FILTROS_VACIOS, estado: "ok" }, HOY)).toEqual([arroz]);
  });

  it("combina los filtros entre sí", () => {
    const f = { busqueda: "leche", categoria: "Lácteos", calidadMinima: 3 as const, estado: "vencido" as const };
    expect(filtrarProductos(todos, f, HOY)).toEqual([leche]);
    expect(filtrarProductos(todos, { ...f, estado: "por-vencer" }, HOY)).toEqual([]);
  });
});

describe("hayFiltrosActivos", () => {
  it("detecta cualquier filtro activo", () => {
    expect(hayFiltrosActivos(FILTROS_VACIOS)).toBe(false);
    expect(hayFiltrosActivos({ ...FILTROS_VACIOS, busqueda: "  " })).toBe(false);
    expect(hayFiltrosActivos({ ...FILTROS_VACIOS, calidadMinima: 1 })).toBe(true);
    expect(hayFiltrosActivos({ ...FILTROS_VACIOS, estado: "ok" })).toBe(true);
  });
});
