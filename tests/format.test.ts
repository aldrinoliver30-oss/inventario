import { describe, expect, it } from "vitest";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/format";

describe("format", () => {
  it("precio con 2 decimales", () => {
    expect(formatearPrecio(1.8)).toMatch(/^1[.,]80$/);
  });
  it("cantidad sin decimales sobrantes", () => {
    expect(formatearCantidad(15)).toBe("15");
  });
  it("fecha DD/MM/YYYY", () => {
    expect(formatearFecha("2026-12-01")).toBe("01/12/2026");
  });
});
