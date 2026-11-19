export type EstadoAlmacenamiento = "persistente" | "no-persistente" | "no-soportado";

type StorageManagerParcial = Partial<Pick<StorageManager, "persist" | "persisted">>;

function gestor(): StorageManagerParcial | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.storage;
}

/** Consulta si el navegador ya garantiza que no borrará los datos. */
export async function consultarAlmacenamiento(
  storage: StorageManagerParcial | undefined = gestor(),
): Promise<EstadoAlmacenamiento> {
  if (!storage?.persisted) return "no-soportado";
  try {
    return (await storage.persisted()) ? "persistente" : "no-persistente";
  } catch {
    return "no-soportado";
  }
}

/** Pide almacenamiento persistente (si ya lo tiene, no vuelve a pedirlo). */
export async function solicitarAlmacenamientoPersistente(
  storage: StorageManagerParcial | undefined = gestor(),
): Promise<EstadoAlmacenamiento> {
  const actual = await consultarAlmacenamiento(storage);
  if (actual !== "no-persistente" || !storage?.persist) return actual;
  try {
    return (await storage.persist()) ? "persistente" : "no-persistente";
  } catch {
    return "no-persistente";
  }
}

export const TEXTO_ALMACENAMIENTO: Record<EstadoAlmacenamiento, string> = {
  persistente: "concedido",
  "no-persistente": "no concedido",
  "no-soportado": "no soportado por este navegador",
};
