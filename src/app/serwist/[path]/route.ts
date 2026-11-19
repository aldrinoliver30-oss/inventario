// Sirve el service worker compilado en /serwist/sw.js (patrón next-turbo-basic de Serwist,
// adaptado a cacheComponents: sin `dynamic`/`revalidate`, con 'use cache' para prerenderizarlo).
import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import path from "node:path";
import { createSerwistRoute } from "@serwist/turbopack";
import { PAGINAS_OFFLINE } from "@/lib/rutas";

/**
 * Revisión de las páginas precacheadas = huella de los archivos de .next/static
 * (sus nombres llevan el hash del contenido). Es igual en todos los procesos del
 * build y solo cambia cuando cambia el código, así que no hay avisos de versión falsos.
 */
function revisionDelBuild(): string {
  const huella = createHash("sha256");
  try {
    const archivos = readdirSync(path.join(process.cwd(), ".next", "static"), { recursive: true });
    for (const a of archivos.map(String).sort()) huella.update(`${a}\n`);
  } catch {
    huella.update(String(Date.now()));
  }
  return huella.digest("hex").slice(0, 16);
}

const revision = revisionDelBuild();

const ruta = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: PAGINAS_OFFLINE.map((url) => ({ url, revision })),
});

async function archivo(ruta_: Promise<string>): Promise<{ cuerpo: string; tipo: string }> {
  "use cache";
  const path = await ruta_;
  const res = await ruta.GET(new Request("http://localhost"), { params: Promise.resolve({ path }) });
  return { cuerpo: await res.text(), tipo: res.headers.get("Content-Type") ?? "text/plain" };
}

export const { generateStaticParams } = ruta;

export async function GET(_: Request, { params }: RouteContext<"/serwist/[path]">) {
  const { cuerpo, tipo } = await archivo(params.then((p) => p.path));
  return new Response(cuerpo, {
    headers: {
      "Content-Type": tipo,
      "Service-Worker-Allowed": "/",
      // El navegador siempre debe revisar si hay un sw.js nuevo.
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
