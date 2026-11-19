# Inventario

App web de inventario para vendedores y distribuidores, pensada para el celular.

- Productos con calidad (1–5 ★), vencimiento, lote, proveedor, código/SKU, notas y foto.
- Entradas y salidas de stock con historial.
- Avisos dentro de la app cuando un producto llega a su stock mínimo o se agota, y cuando vence o está por vencer.
- Se instala en el celular como app (PWA) y funciona sin internet.
- Los datos se guardan solo en el dispositivo (IndexedDB). Desde Ajustes se puede exportar e importar un respaldo `.json`.

## Instalar en el celular

1. Abre la dirección publicada en el navegador del celular (Chrome en Android, Safari en iPhone).
2. Menú del navegador → **Instalar app** o **Agregar a pantalla de inicio**.
3. Ábrela una vez con internet; desde ahí funciona sin conexión.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000 (sin service worker)
npm test           # tests de la lógica (Vitest)
npm run build && npm start   # versión de producción, con service worker
npm run iconos     # regenera los PNG desde public/icons/icon.svg
```

Stack: Next.js 16 (App Router, `cacheComponents`), TypeScript, Tailwind CSS 4, Dexie (IndexedDB) y Serwist (service worker).

Las especificaciones están en [`specs/`](specs/): la [SPEC 03](specs/03-inventario-v2.md) describe la app y la [SPEC 02](specs/02-pwa-offline.md) la PWA y el modo offline.
