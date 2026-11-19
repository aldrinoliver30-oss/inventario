# SPEC 02 — PWA instalable con modo offline total

> **Estado:** Implementado (sobre la v2 de la SPEC 03)
> **Depende de:** SPEC 03
> **Fecha:** 2026-11-19
> **Objetivo:** Convertir el inventario en una PWA instalable desde el menú del navegador que abre, recarga y navega todas sus pantallas sin internet, y avisa cuando hay una versión nueva.

## Por qué existe esta spec

La SPEC 01 dejó la app como web normal y pospuso la PWA.
Como los datos ya viven en IndexedDB, lo único que impide usarla sin internet es que el navegador necesita la red para cargar la propia app.
Un service worker resuelve eso y, de paso, hace la app instalable en la pantalla de inicio.
Pedir almacenamiento persistente reduce además el riesgo de pérdida de datos anotado en la SPEC 01.

## Alcance

**Dentro:**

- Web App Manifest con `src/app/manifest.ts` (nombre, colores, íconos, `display: "standalone"`).
- Íconos placeholder generados por script desde un SVG: 192 px, 512 px, 512 px maskable y 180 px para iPhone.
- Service worker con Serwist (`serwist`, `@serwist/turbopack`, `@serwist/window`) que precachea la app completa en cada build.
- Offline total: abrir desde el ícono, recargar y navegar a cualquier pantalla sin red.
- Cambio de rutas de producto a rutas fijas con query param: `/productos/ver?id=…` y `/productos/editar?id=…`.
- Redirección de las rutas viejas `/productos/<id>` y `/productos/<id>/editar` a las nuevas.
- Aviso "Hay una nueva versión" con botón "Actualizar" cuando el service worker detecta una versión nueva.
- Solicitud de almacenamiento persistente (`navigator.storage.persist()`) al iniciar, con su estado visible en Ajustes.
- Service worker activo solo en build de producción (`npm run build && npm start`), nunca en `npm run dev`.

**Fuera de alcance (para specs futuras):**

- Botón propio "Instalar app" y guía de instalación para iPhone (se instala desde el menú del navegador).
- Indicador o banner de "Sin conexión".
- Notificaciones push.
- Publicar la app en internet (Vercel u otro hosting) y pruebas en un celular real.
- Logo o identidad visual definitiva.
- Sincronización en segundo plano o cualquier backend.
- Cambios en el modelo de datos de IndexedDB.

## Modelo de datos

Esta feature no introduce estructuras nuevas en IndexedDB. Reutiliza el modelo de la SPEC 01 sin cambios.

Estructuras nuevas fuera de la base:

```ts
// src/app/manifest.ts — valores fijos del manifest
{
  name: "Inventario",
  short_name: "Inventario",
  description: "Inventario de productos con vencimientos y movimientos de stock",
  lang: "es",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#047857",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}
```

```ts
// src/lib/storage.ts
export type EstadoAlmacenamiento = "persistente" | "no-persistente" | "no-soportado";
```

Convenciones:

- Las páginas precacheadas son `/`, `/productos/nuevo`, `/productos/ver`, `/productos/editar` y `/ajustes`, con revisión ligada al build.
- Las navegaciones ignoran el query string al buscar en caché: `/productos/ver?id=abc` se sirve desde `/productos/ver`.
- El ícono fuente es `public/icons/icon.svg`: caja blanca sobre fondo `#047857`. El maskable deja un margen de seguridad del 20 %.

## Estructura de archivos

```
public/icons/
  icon.svg                     // fuente del ícono placeholder
  icon-192.png                 // generado
  icon-512.png                 // generado
  icon-maskable-512.png        // generado
scripts/
  generar-iconos.mjs           // SVG → PNG con sharp; `npm run iconos`
src/app/
  manifest.ts                  // nuevo
  apple-icon.png               // generado, 180×180 (convención de archivo de Next)
  sw.ts                        // código fuente del service worker (Serwist)
  serwist/[path]/route.ts      // sirve el service worker compilado (según ejemplo next-turbo-basic de Serwist)
  layout.tsx                   // + metadata appleWebApp + <PwaUpdater />
  productos/ver/page.tsx       // nuevo: detalle por ?id= (antes productos/[id]/page.tsx)
  productos/ver/loading.tsx
  productos/editar/page.tsx    // nuevo: edición por ?id= (antes productos/[id]/editar/page.tsx)
  productos/editar/loading.tsx
  productos/[id]/              // se elimina
  ajustes/page.tsx             // + estado del almacenamiento persistente
src/components/
  PwaUpdater.tsx               // registra el SW en producción, pide persistencia y muestra el aviso de versión
  ProductCard.tsx              // enlace a /productos/ver?id=
src/lib/
  storage.ts                   // solicitar/consultar almacenamiento persistente
next.config.ts                 // + redirects de rutas viejas
tests/
  manifest.test.ts
  storage.test.ts
```

## Cambios al implementar sobre la v2 (SPEC 03)

La spec se escribió para la app de la SPEC 01. Al aplicarla sobre la v2 cambió lo siguiente:

- Páginas precacheadas: además de las de la spec, `/avisos`. La lista vive en `src/lib/rutas.ts` (`PAGINAS_OFFLINE`), junto con `rutaProducto(id)` y `rutaEditar(id)`.
- Colores: `theme_color: "#059669"` (emerald-600 de la v2) y `background_color: "#f4f5f7"`. Ícono: caja blanca sobre `#059669`.
- Componentes renombrados: `TarjetaProducto` en vez de `ProductCard`. Persistencia en `src/lib/almacenamiento.ts` (no `storage.ts`). Tests en `tests/pwa.test.ts`.
- **Serwist + `cacheComponents`:** `@serwist/turbopack` 9.5.15 exporta `dynamic`, `dynamicParams` y `revalidate`, que Next 16 no admite con `cacheComponents`. La ruta `src/app/serwist/[path]/route.ts` reexporta solo `generateStaticParams` y un `GET` propio que obtiene el archivo desde una función `'use cache'`. Así `/serwist/sw.js` se prerenderiza en el build.
- **Revisión de las páginas:** es un hash de los nombres de archivo de `.next/static`, que llevan el hash del contenido. Es la misma en todos los procesos del build y solo cambia si cambia el código, así que no aparecen avisos de versión falsos.
- **Query string:** el precache ignora solo el parámetro `id` (`ignoreURLParametersMatching: [/^id$/]`). Las peticiones RSC (`?_rsc=`) no coinciden y siguen la estrategia por defecto.
- El SW usa `skipWaiting: false`. `PwaUpdater` muestra el aviso con el evento `waiting` de `@serwist/window` y, al tocar "Actualizar", envía `SKIP_WAITING` y recarga en `controlling`. También busca versiones nuevas al volver a la app (`visibilitychange`).
- Ajustes muestra además una línea "Usar como app" que explica cómo instalarla desde el menú del navegador. No es un botón ni una guía.
- `esbuild` y `sharp` usan sus binarios nativos. npm bloqueó sus scripts de post-instalación, pero funcionan sin ellos.

## Plan de implementación

1. Crear `src/app/productos/ver/page.tsx` leyendo el id con `useSearchParams()`, con el mismo contenido que el detalle actual, y su `loading.tsx`. Cambiar el enlace de `ProductCard` y la redirección tras crear un producto a `/productos/ver?id=…`. Verificación: `npm run build` compila y el detalle abre desde la lista.
2. Crear `src/app/productos/editar/page.tsx` con `useSearchParams()` y su `loading.tsx`. Cambiar los enlaces Editar, "← Volver" y la redirección tras guardar. Eliminar `src/app/productos/[id]/`. Agregar en `next.config.ts` los redirects de `/productos/:id` y `/productos/:id/editar` a las rutas nuevas, sin capturar `nuevo`, `ver` ni `editar`.
3. Crear `public/icons/icon.svg`, agregar `sharp` como dependencia de desarrollo y `scripts/generar-iconos.mjs` con script `npm run iconos`. Generar y versionar los cuatro PNG.
4. Crear `src/app/manifest.ts` con los valores del modelo de datos y `tests/manifest.test.ts`. Agregar a `layout.tsx` la metadata `appleWebApp` (`capable`, `title: "Inventario"`, `statusBarStyle: "default"`). Verificación: `/manifest.webmanifest` responde con los valores de la spec.
5. Instalar `serwist`, `@serwist/turbopack`, `@serwist/window` y `esbuild`. Crear `src/app/sw.ts` y `src/app/serwist/[path]/route.ts` siguiendo el ejemplo `next-turbo-basic` de Serwist. Crear `PwaUpdater` que registra el service worker solo si `process.env.NODE_ENV === "production"`, y montarlo en `layout.tsx`. Verificación: en `npm start`, DevTools → Application → Service Workers muestra el SW activo; en `npm run dev` no hay SW.
6. Configurar en `sw.ts` el precache de las cinco páginas y la búsqueda en caché ignorando el query string. Verificación: con DevTools en Offline, recargar `/productos/ver?id=<id>` carga el producto.
7. Agregar a `PwaUpdater` el aviso "Hay una nueva versión" con botón "Actualizar". El botón activa el SW en espera y recarga la página. El SW nuevo no se activa solo mientras el aviso está abierto.
8. Crear `src/lib/storage.ts` con `solicitarAlmacenamientoPersistente()` y `consultarAlmacenamiento()`, ambos devolviendo `EstadoAlmacenamiento`, y `tests/storage.test.ts`. `PwaUpdater` lo solicita al iniciar. Ajustes muestra "Almacenamiento persistente: concedido", "no concedido" o "no soportado por este navegador".

## Criterios de aceptación

Todos los criterios de PWA se verifican en Chrome de escritorio con `npm run build && npm start` en `http://localhost:3000`.

- [x] `npm run build`, `npm run lint` y `npm test` terminan sin errores.
- [x] Todos los criterios de la SPEC 01 siguen cumpliéndose con las rutas nuevas.
- [x] Tocar un producto en la lista abre `/productos/ver?id=<id>` con su detalle.
- [x] "Editar" abre `/productos/editar?id=<id>` y guardar vuelve al detalle.
- [x] `/productos/ver?id=inexistente` muestra "Producto no encontrado".
- [x] Abrir `/productos/<id>` redirige a `/productos/ver?id=<id>`.
- [x] Abrir `/productos/<id>/editar` redirige a `/productos/editar?id=<id>`.
- [x] `/productos/nuevo` sigue mostrando el formulario de alta (no se redirige).
- [x] `/manifest.webmanifest` devuelve `name: "Inventario"`, `display: "standalone"`, `theme_color: "#047857"` y los tres íconos.
- [x] Los cuatro PNG existen con las medidas 192×192, 512×512, 512×512 y 180×180.
- [x] DevTools → Application → Manifest no muestra errores de instalabilidad.
- [x] Chrome ofrece "Instalar Inventario" en su menú y la app instalada abre en ventana propia sin barra de direcciones. (Verificado con `Page.getInstallabilityErrors` de Chrome: sin errores; el menú en sí se revisa a mano.)
- [x] En `npm start`, DevTools → Application → Service Workers muestra un SW activado con alcance `/`.
- [x] En `npm run dev` no se registra ningún service worker.
- [x] Con DevTools en Offline, recargar `/` muestra la lista con los productos guardados.
- [x] Con DevTools en Offline, recargar `/productos/ver?id=<id>` de un producto nunca abierto antes muestra su detalle.
- [x] Con DevTools en Offline, recargar `/productos/nuevo`, `/productos/editar?id=<id>` y `/ajustes` muestra cada pantalla.
- [x] Con DevTools en Offline, crear un producto y registrar un movimiento funciona y persiste al recargar.
- [x] Tras un nuevo `npm run build && npm start` con un cambio visible, la pestaña abierta muestra "Hay una nueva versión".
- [x] Mientras el aviso está abierto, la página no se recarga sola.
- [x] Tocar "Actualizar" recarga la página y muestra el cambio nuevo.
- [x] Ajustes muestra el estado del almacenamiento persistente con uno de los tres textos definidos.

## Decisiones

- **Sí:** offline total con service worker. Sin él, recargar o abrir la app sin red no carga nada.
- **No:** solo `useOffline` de Next. No cubre recargas ni el arranque desde el ícono.
- **Sí:** Serwist con `@serwist/turbopack`. Lo recomienda la guía de PWA de Next 16 y genera la lista de precache en cada build.
- **No:** `sw.js` escrito a mano. Mantener a mano los archivos con hash de Next es frágil.
- **Sí:** rutas fijas con `?id=`. Así las páginas se precachean al compilar y cualquier producto abre offline.
- **No:** mantener `/productos/<id>` con caché al visitar. Un producto nunca abierto con red no cargaría al recargar offline.
- **Sí:** redirects de las rutas viejas. Evita enlaces rotos en historiales o marcadores.
- **Sí:** instalación solo desde el menú del navegador. Decisión del usuario; menos código.
- **No:** botón "Instalar app" ni guía para iPhone. Se pospone.
- **Sí:** aviso "Hay una nueva versión" con botón. El usuario decide cuándo recargar y no pierde un formulario a medias.
- **No:** activación automática de la versión nueva.
- **Sí:** íconos placeholder generados por script. Se reemplazan después cambiando solo `icon.svg` y ejecutando `npm run iconos`.
- **Sí:** `sharp` como dependencia de desarrollo para generar los PNG. Los PNG se versionan; el build no lo necesita.
- **Sí:** pruebas solo en PC con DevTools. Publicar en internet y probar en un celular real va en otra spec.
- **Sí:** pedir almacenamiento persistente al iniciar. Mitiga el borrado de IndexedDB anotado en la SPEC 01.
- **No:** indicador "Sin conexión". La app funciona igual sin red, así que el aviso no aporta.
- **Sí:** service worker solo en producción. En dev serviría código viejo y confundiría al programar.
- **Sí:** esta spec reemplaza la decisión "web normal sin PWA" de la SPEC 01.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La API de `@serwist/turbopack` difiere de lo descrito en el paso 5 | Seguir el ejemplo oficial `next-turbo-basic` de la versión instalada; si cambia la estructura de archivos, actualizar esta spec antes de seguir. |
| `cacheComponents` exige `<Suspense>` alrededor de `useSearchParams()` | `loading.tsx` en `productos/ver` y `productos/editar`, igual que se hizo con `useParams()` en la SPEC 01. |
| Un SW viejo sigue sirviendo una versión anterior | Aviso de nueva versión con botón "Actualizar"; el precache usa revisiones ligadas al build. |
| El redirect de `/productos/:id` captura `nuevo`, `ver` o `editar` | La regla excluye esos segmentos; hay un criterio de aceptación para `/productos/nuevo`. |
| iPhone no ofrece instalación ni persistencia igual que Chrome | Fuera de alcance probar en iPhone; la app sigue funcionando como web normal. |
| El navegador niega el almacenamiento persistente | Ajustes lo muestra; el respaldo JSON de la SPEC 01 sigue siendo la protección principal. |

## Lo que **no** está en esta spec

- Botón "Instalar app" y guía de instalación para iPhone.
- Indicador "Sin conexión".
- Notificaciones push.
- Publicación en internet y pruebas en celular real.
- Logo definitivo.
- Sincronización o backend.

Cada uno, si llega, va en su propia spec.
