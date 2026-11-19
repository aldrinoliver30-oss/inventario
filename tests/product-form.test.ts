import { describe, expect, it } from "vitest";
import {
  validarFormularioProducto,
  VALORES_VACIOS,
  type ValoresFormulario,
} from "@/components/ProductForm";

const validos: ValoresFormulario = {
  nombre: "  Leche Entera ",
  categoria: "Lácteos",
  unidad: "litro",
  calidad: 4,
  fechaVencimiento: "2026-12-01",
  cantidad: "10",
  precioCompra: "1,2",
  precioVenta: "1.8",
};

describe("validarFormularioProducto", () => {
  it("formulario vacío marca los 5 campos obligatorios", () => {
    const r = validarFormularioProducto(VALORES_VACIOS, true);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(
        ["calidad", "categoria", "fechaVencimiento", "nombre", "unidad"].sort(),
      );
    }
  });

  it("datos válidos se convierten a números y se recorta el texto", () => {
    expect(validarFormularioProducto(validos, true)).toEqual({
      ok: true,
      cantidad: 10,
      datos: {
        nombre: "Leche Entera",
        categoria: "Lácteos",
        unidad: "litro",
        calidad: 4,
        fechaVencimiento: "2026-12-01",
        precioCompra: 1.2,
        precioVenta: 1.8,
      },
    });
  });

  it.each(["cantidad", "precioCompra", "precioVenta"] as const)("rechaza %s negativo", (campo) => {
    const r = validarFormularioProducto({ ...validos, [campo]: "-1" }, true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[campo]).toBe("No puede ser negativo.");
  });

  it("rechaza texto no numérico en precio", () => {
    expect(validarFormularioProducto({ ...validos, precioVenta: "abc" }, true).ok).toBe(false);
  });

  it("sin cantidad (edición) ignora el campo cantidad", () => {
    const r = validarFormularioProducto({ ...validos, cantidad: "-5" }, false);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cantidad).toBe(0);
  });

  it("rechaza nombre de más de 100 caracteres", () => {
    expect(validarFormularioProducto({ ...validos, nombre: "a".repeat(101) }, true).ok).toBe(false);
  });
});
