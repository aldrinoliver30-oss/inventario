/// <reference lib="webworker" />
// Service worker de la app (Serwist). Se compila con esbuild desde src/app/serwist/[path]/route.ts.
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // /productos/ver?id=abc se sirve desde la página precacheada /productos/ver.
    // Solo se ignora "id": las peticiones RSC (?_rsc=…) no coinciden y siguen su estrategia normal.
    ignoreURLParametersMatching: [/^id$/],
  },
  // La versión nueva espera hasta que el usuario toque "Actualizar" (ver PwaUpdater).
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
