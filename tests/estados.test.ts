import { describe, expect, it } from "vitest";
import {
  debeAvisarStock,
  diasHasta,
  estadoStock,
  estadoVencimiento,
  hoyISO,
  resumenAvisos,
} from "@/lib/estados";
import { producto } from "./helpers";

const HOY = "2026-11-19";

describe("estadoVencimiento", () => {
  it.each([
    ["2026-11-18", "vencido"],
    ["2026-11-19", "por-vencer"],
    ["2026-12-19", "por-vencer"], // hoy + 30
    ["2026-12-20", "ok"], // hoy + 31
  ])("%s → %s", (fecha, esperado) => {
    expect(estadoVencimiento(fecha, HOY)).toBe(esperado);
  });

  it("sin fecha → sin-fecha", () => {
    expect(estadoVencimiento(null, HOY)).toBe("sin-fecha");
  });

  it("diasHasta cruza meses y años", () => {
    expect(diasHasta("2027-01-01", "2026-12-31")).toBe(1);
    expect(diasHasta("2026-03-01", "2026-02-28")).toBe(1);
  });

  it("hoyISO usa la fecha local", () => {
    expect(hoyISO(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("estadoStock", () => {
  it.each([
    [0, 3, "agotado"],
    [1, 3, "bajo"],
    [3, 3, "bajo"],
    [4, 3, "ok"],
    [1, 0, "ok"],
    [0, 0, "agotado"],
  ])("cantidad %d, mínimo %d → %s", (cantidad, stockMinimo, esperado) => {
    expect(estadoStock({ cantidad, stockMinimo })).toBe(esperado);
  });
});

describe("debeAvisarStock", () => {
  it("avisa al entrar en stock bajo o al agotarse", () => {
    expect(debeAvisarStock("ok", "bajo")).toBe(true);
    expect(debeAvisarStock("ok", "agotado")).toBe(true);
    expect(debeAvisarStock("bajo", "agotado")).toBe(true);
  });
  it("no repite el aviso si ya estaba bajo o si queda ok", () => {
    expect(debeAvisarStock("bajo", "bajo")).toBe(false);
    expect(debeAvisarStock("ok", "ok")).toBe(false);
    expect(debeAvisarStock("agotado", "ok")).toBe(false);
  });
});

describe("resumenAvisos", () => {
  it("agrupa y cuenta productos únicos", () => {
    const lista = [
      producto({ cantidad: 0 }),
      producto({ cantidad: 2, stockMinimo: 3, fechaVencimiento: "2026-11-01" }), // bajo + vencido
      producto({ cantidad: 50, fechaVencimiento: "2026-11-25" }), // por vencer
      producto({ cantidad: 50, fechaVencimiento: null }), // ok
    ];
    const r = resumenAvisos(lista, HOY);
    expect(r.agotados).toHaveLength(1);
    expect(r.bajos).toHaveLength(1);
    expect(r.vencidos).toHaveLength(1);
    expect(r.porVencer).toHaveLength(1);
    expect(r.total).toBe(3);
  });
});
