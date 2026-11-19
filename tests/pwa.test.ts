import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { consultarAlmacenamiento, solicitarAlmacenamientoPersistente } from "@/lib/almacenamiento";
import { rutaEditar, rutaProducto } from "@/lib/rutas";

describe("manifest", () => {
  it("es instalable: nombre, standalone, colores e íconos", () => {
    const m = manifest();
    expect(m).toMatchObject({
      name: "Inventario",
      short_name: "Inventario",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#059669",
    });
    expect(m.icons).toEqual([
      expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ src: "/icons/icon-maskable-512.png", sizes: "512x512", purpose: "maskable" }),
    ]);
  });
});

describe("rutas", () => {
  it("usan rutas fijas con ?id= codificado", () => {
    expect(rutaProducto("abc")).toBe("/productos/ver?id=abc");
    expect(rutaEditar("a b")).toBe("/productos/editar?id=a%20b");
  });
});

describe("almacenamiento persistente", () => {
  it("no soportado si no existe la API", async () => {
    expect(await consultarAlmacenamiento(undefined)).toBe("no-soportado");
    expect(await solicitarAlmacenamientoPersistente({})).toBe("no-soportado");
  });

  it("ya persistente no vuelve a pedir", async () => {
    let pedido = false;
    const s = {
      persisted: async () => true,
      persist: async () => ((pedido = true), true),
    };
    expect(await solicitarAlmacenamientoPersistente(s)).toBe("persistente");
    expect(pedido).toBe(false);
  });

  it("pide y refleja la respuesta del navegador", async () => {
    expect(
      await solicitarAlmacenamientoPersistente({ persisted: async () => false, persist: async () => true }),
    ).toBe("persistente");
    expect(
      await solicitarAlmacenamientoPersistente({ persisted: async () => false, persist: async () => false }),
    ).toBe("no-persistente");
  });

  it("un error del navegador no rompe la app", async () => {
    expect(
      await consultarAlmacenamiento({
        persisted: async () => {
          throw new Error("x");
        },
      }),
    ).toBe("no-soportado");
  });
});
