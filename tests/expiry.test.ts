import { describe, expect, it } from "vitest";
import {
  contarPorEstado,
  DIAS_ALERTA,
  fechaLocalISO,
  getEstadoVencimiento,
  sumarDias,
} from "@/lib/expiry";

// 19 de noviembre de 2026, 23:30 hora local (cerca de medianoche a propósito).
const HOY = new Date(2026, 10, 19, 23, 30);

describe("fechaLocalISO", () => {
  it("usa la fecha local, no UTC", () => {
    expect(fechaLocalISO(HOY)).toBe("2026-11-19");
  });
});

describe("getEstadoVencimiento", () => {
  it("el umbral es de 30 días", () => {
    expect(DIAS_ALERTA).toBe(30);
  });

  it("ayer → vencido", () => {
    expect(getEstadoVencimiento("2026-11-18", HOY)).toBe("vencido");
  });

  it("hoy → por-vencer", () => {
    expect(getEstadoVencimiento("2026-11-19", HOY)).toBe("por-vencer");
  });

  it("hoy + 30 días → por-vencer", () => {
    const fecha = fechaLocalISO(sumarDias(HOY, 30));
    expect(fecha).toBe("2026-12-19");
    expect(getEstadoVencimiento(fecha, HOY)).toBe("por-vencer");
  });

  it("hoy + 31 días → ok", () => {
    const fecha = fechaLocalISO(sumarDias(HOY, 31));
    expect(fecha).toBe("2026-12-20");
    expect(getEstadoVencimiento(fecha, HOY)).toBe("ok");
  });

  it("cruza cambio de año correctamente", () => {
    const finDeAnio = new Date(2026, 11, 31);
    expect(getEstadoVencimiento("2027-01-30", finDeAnio)).toBe("por-vencer");
    expect(getEstadoVencimiento("2027-01-31", finDeAnio)).toBe("ok");
    expect(getEstadoVencimiento("2026-12-30", finDeAnio)).toBe("vencido");
  });
});

describe("contarPorEstado", () => {
  it("cuenta vencidos, por vencer y vigentes", () => {
    const productos = ["2026-11-18", "2026-11-01", "2026-11-19", "2026-12-19", "2026-12-20"].map(
      (fechaVencimiento) => ({ fechaVencimiento }),
    );
    expect(contarPorEstado(productos, HOY)).toEqual({ vencido: 2, "por-vencer": 2, ok: 1 });
  });

  it("lista vacía da ceros", () => {
    expect(contarPorEstado([], HOY)).toEqual({ vencido: 0, "por-vencer": 0, ok: 0 });
  });
});
