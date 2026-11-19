# SPEC 03 — Inventario v2 (desde cero): detalles completos y avisos de stock

> **Estado:** Implementado
> **Depende de:** — (reemplaza la app de la SPEC 01)
> **Fecha:** 2026-11-19
> **Objetivo:** Rehacer desde cero una web app móvil de inventario para vendedores y distribuidores con ficha de detalle completa (calidad, vencimiento, lote, proveedor, código, notas, foto), control de stock y avisos dentro de la app cuando un producto baja de su stock mínimo o se agota.

## Por qué existe esta spec

El usuario decidió empezar de cero en lugar de extender la SPEC 01.
La app anterior queda en la rama `master`; esta vive en la rama `v2-inventario`.
Se mantiene el stack (Next.js + TypeScript + Tailwind + IndexedDB/Dexie) porque ya funciona en el proyecto.
La SPEC 02 (PWA offline) sigue en borrador y se podrá aplicar sobre esta versión.

## Alcance

**Dentro:**

- Diseño mobile-first (360–430 px), limpio y moderno, con barra de navegación inferior: Productos, Avisos, Ajustes.
- Datos locales en IndexedDB (base `inventario-v2`, separada de la v1). Un usuario, sin login, sin servidor.
- Producto con: nombre, categoría, unidad, calidad (1–5 ★), vencimiento (opcional), cantidad, stock mínimo, precio de compra, precio de venta, código/SKU, lote, proveedor, notas y foto.
- Foto tomada con la cámara o elegida de la galería, reducida a 800 px y JPEG antes de guardarla.
- Detalle del producto con dos pestañas: **Detalles** (secciones Estado, Calidad y lote, Proveedor y código, Precios, Notas, Foto) y **Movimientos** (registrar y ver historial).
- Movimientos Entrada / Salida. El stock nunca queda negativo.
- Estado de stock: `agotado` (cantidad 0), `bajo` (0 < cantidad ≤ stock mínimo), `ok`.
- Estado de vencimiento: `vencido`, `por-vencer` (≤ 30 días), `ok`, `sin-fecha`.
- Avisos dentro de la app:
  - Etiquetas en cada producto (Agotado, Stock bajo, Vencido, Por vencer).
  - Resumen con contadores en la pantalla principal; tocar uno filtra la lista.
  - Pestaña Avisos con las listas de agotados, stock bajo, vencidos y por vencer, y contador en la barra inferior.
  - Aviso emergente (toast) cuando una salida deja el producto en stock bajo o agotado.
- Búsqueda por nombre/código (sin distinguir mayúsculas ni tildes) y filtros por categoría, calidad mínima, estado de stock y estado de vencimiento.
- Respaldo: exportar e importar `.json` (incluye fotos). Importar reemplaza todo.

**Fuera de alcance:**

- Notificaciones del sistema / push, PWA (ver SPEC 02).
- Nube, sincronización, login, roles.
- Escáner de código de barras, varios lotes por producto, movimientos de ajuste, reportes.

## Modelo de datos

```ts
export type Unidad = "unidad" | "caja" | "paquete" | "kg" | "g" | "litro" | "ml";
export type Calidad = 1 | 2 | 3 | 4 | 5;

export interface Producto {
  id: string;
  nombre: string;                  // 1–100
  categoria: string;               // obligatorio
  unidad: Unidad;
  calidad: Calidad;
  fechaVencimiento: string | null; // "YYYY-MM-DD" o null = no vence
  cantidad: number;                // >= 0, solo cambia vía movimientos
  stockMinimo: number;             // >= 0; 0 = solo avisa al agotarse
  precioCompra: number;
  precioVenta: number;
  codigo: string;                  // opcional ("")
  lote: string;
  proveedor: string;
  notas: string;                   // máx. 1000
  tieneFoto: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Movimiento { id; productoId; tipo: "entrada" | "salida"; cantidad > 0; fecha; nota? }
export interface Foto { productoId: string; dataUrl: string } // tabla aparte para no cargar fotos en la lista

export interface Respaldo { app: "inventario"; version: 2; exportadoEn; productos; movimientos; fotos }
```

Esquema Dexie v1 de `inventario-v2`: `productos: "id, nombre, categoria, fechaVencimiento"`, `movimientos: "id, productoId, fecha"`, `fotos: "productoId"`.

Reglas:

- Crear con cantidad > 0 genera un movimiento `entrada` "Stock inicial".
- Editar no cambia la cantidad.
- `registrarMovimiento` devuelve el estado de stock anterior y el nuevo; la UI muestra el toast si el nuevo es `bajo` o `agotado` y es distinto del anterior o es `agotado`.

## Criterios de aceptación

- [x] `npm run build`, `npm run lint` y `npm test` pasan.
- [x] A 375 px ninguna pantalla tiene scroll horizontal.
- [x] Crear un producto con todos los campos, incluida la foto, y verlos en la pestaña Detalles.
- [x] El formulario rechaza campos obligatorios vacíos y números negativos, mostrando el error junto al campo.
- [x] Producto con cantidad 0 → etiqueta "Agotado"; cantidad ≤ mínimo → "Stock bajo".
- [x] Una salida que deja el stock en el mínimo o debajo muestra el toast de aviso.
- [x] Una salida mayor al stock se rechaza y el stock no cambia.
- [x] La pestaña Avisos y el contador de la barra inferior reflejan agotados, stock bajo, vencidos y por vencer.
- [x] Tocar un contador del resumen filtra la lista.
- [x] Buscar "leche" encuentra "LECHÉ"; buscar por código también funciona.
- [x] Exportar e importar en un navegador limpio restaura productos, movimientos y fotos.
- [x] Importar un archivo inválido muestra error y no cambia nada.
- [x] `/productos/id-inexistente` muestra "Producto no encontrado".
