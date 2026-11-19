import { describe, expect, it } from "vitest";
import { FORMULARIO_VACIO, validarProducto, type FormularioProducto } from "@/lib/validacion";

const valido: FormularioProducto = {
  ...FORMULARIO_VACIO,
  nombre: "  Arroz ",
  categoria: "Granos",
  unidad: "kg",
  calidad: 5,
  cantidad: "2,5",
  stockMinimo: "1",
  precioCompra: "3.456",
};

describe("validarProducto", () => {
  it("acepta datos válidos y normaliza", () => {
    const r = validarProducto(valido);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos.nombre).toBe("Arroz");
    expect(r.datos.cantidad).toBe(2.5);
    expect(r.datos.precioCompra).toBe(3.46);
    expect(r.datos.precioVenta).toBe(0);
    expect(r.datos.fechaVencimiento).toBeNull();
  });

  it("marca los obligatorios", () => {
    const r = validarProducto(FORMULARIO_VACIO);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(["calidad", "categoria", "nombre"]);
  });

  it("rechaza negativos y texto no numérico", () => {
    const r = validarProducto({ ...valido, cantidad: "-1", precioVenta: "abc", stockMinimo: "-2" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.cantidad).toMatch(/negativ/);
    expect(r.errores.stockMinimo).toMatch(/negativ/);
    expect(r.errores.precioVenta).toMatch(/número/);
  });

  it("exige enteros para unidades contables", () => {
    const r = validarProducto({ ...valido, unidad: "caja", cantidad: "1.5" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores.cantidad).toMatch(/entero/);
  });
});
