import { describe, expect, it } from "vitest";

describe("entorno de tests", () => {
  it("tiene IndexedDB disponible", () => {
    expect(globalThis.indexedDB).toBeDefined();
  });
});
