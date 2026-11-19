# SPEC 01 — Inventario móvil con vencimientos y movimientos de stock

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-11-19
> **Objetivo:** Una web app en Next.js, pensada para el celular, donde un vendedor o distribuidor registra sus productos con calidad y vencimiento, controla entradas y salidas de stock y ve de un vistazo qué está vencido o por vencer.

## Por qué existe esta spec

Es la primera spec del proyecto y define la base (stack, modelo de datos y almacenamiento) sobre la que se apoyarán las siguientes.
Se eligió una web normal con datos solo en el navegador para tener algo usable sin servidor, cuentas ni internet permanente.
El precio de esa decisión es que los datos viven en un único navegador; por eso el respaldo JSON entra desde el inicio.

## Alcance

**Dentro:**

- Proyecto Next.js (App Router) con TypeScript y Tailwind CSS, diseño mobile-first (ancho de referencia 360–430 px).
- Persistencia local en IndexedDB mediante Dexie. Sin backend.
- Un solo usuario, sin login.
- CRUD de productos con: nombre, categoría, unidad, calidad (1–5 estrellas), fecha de vencimiento, cantidad, precio de compra y precio de venta.
- Un vencimiento por registro. Un lote nuevo con otra fecha se registra como otro producto.
- Estado de vencimiento visual: `vencido` (rojo), `por-vencer` ≤ 30 días (amarillo), `ok` (verde).
- Resumen en la pantalla principal con el conteo de productos vencidos y por vencer.
- Búsqueda por nombre y filtros por categoría, calidad mínima y estado de vencimiento.
- Movimientos de stock de tipo Entrada y Salida, con historial en el detalle del producto. Una salida mayor al stock disponible se rechaza.
- Eliminación total del producto y su historial tras un diálogo de confirmación.
- Exportar todos los datos a un archivo `.json` e importarlos desde Ajustes.
- Interfaz en español.

**Fuera de alcance (para specs futuras):**

- PWA instalable, service worker y modo offline garantizado.
- Notificaciones push de vencimiento.
- Sincronización en la nube, varios dispositivos o varios usuarios.
- Login y roles (vendedor / distribuidor).
- Varios lotes por producto.
- Movimientos de tipo Ajuste (merma, conteo físico).
- Campos SKU/código, lote, proveedor, notas y foto.
- Escaneo de código de barras.
- Archivar productos.
- Umbral de vencimiento configurable.
- Reportes, gráficos y valorización del inventario.
- Conversión o selección de moneda.

## Modelo de datos

```ts
// src/lib/types.ts
export type Unidad = "unidad" | "caja" | "paquete" | "kg" | "g" | "litro" | "ml";

export interface Producto {
  id: string;               // crypto.randomUUID()
  nombre: string;           // obligatorio, 1–100 caracteres
  categoria: string;        // texto libre obligatorio; se sugieren las ya usadas
  unidad: Unidad;
  calidad: 1 | 2 | 3 | 4 | 5;
  fechaVencimiento: string; // "YYYY-MM-DD"
  cantidad: number;         // >= 0; solo cambia vía movimientos
  precioCompra: number;     // >= 0, moneda local, 2 decimales
  precioVenta: number;      // >= 0, moneda local, 2 decimales
  creadoEn: string;         // ISO 8601
  actualizadoEn: string;    // ISO 8601
}

export type TipoMovimiento = "entrada" | "salida";

export interface Movimiento {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;         // > 0
  fecha: string;            // ISO 8601
  nota?: string;            // máx. 200 caracteres
}

export type EstadoVencimiento = "vencido" | "por-vencer" | "ok";

export interface Respaldo {
  app: "inventario";
  version: 1;
  exportadoEn: string;      // ISO 8601
  productos: Producto[];
  movimientos: Movimiento[];
}
```

```ts
// src/lib/db.ts — base IndexedDB "inventario", versión 1
db.version(1).stores({
  productos: "id, nombre, categoria, calidad, fechaVencimiento",
  movimientos: "id, productoId, fecha",
});
```

Convenciones:

- `cantidad` del producto se modifica solo dentro de una transacción Dexie que también crea el `Movimiento`.
- Al crear un producto con cantidad > 0 se genera automáticamente un movimiento `entrada` con nota `"Stock inicial"`.
- El formulario de edición no permite cambiar `cantidad`.
- Estado de vencimiento, comparando solo fechas en hora local: `vencido` si `fechaVencimiento < hoy`; `por-vencer` si `hoy <= fechaVencimiento <= hoy + 30 días`; `ok` en otro caso.
- Constante `DIAS_ALERTA = 30` en `src/lib/expiry.ts`.
- Precios se muestran con `Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, sin símbolo de moneda.

## Estructura de archivos

```
src/
  app/
    layout.tsx                    // shell móvil, barra superior, lang="es"
    page.tsx                      // lista + resumen + búsqueda/filtros
    productos/nuevo/page.tsx
    productos/[id]/page.tsx       // detalle + movimientos
    productos/[id]/editar/page.tsx
    ajustes/page.tsx              // exportar / importar
  components/
    ProductForm.tsx
    ProductCard.tsx
    StarRating.tsx
    ExpiryBadge.tsx
    ExpirySummary.tsx
    Filters.tsx
    MovementForm.tsx
    MovementList.tsx
    ConfirmDialog.tsx
  lib/
    types.ts
    db.ts
    expiry.ts
    products.ts                   // crear, actualizar, eliminar (con movimientos)
    movements.ts                  // registrarMovimiento con validación de stock
    backup.ts                     // exportar / validar / importar
tests/
  expiry.test.ts
  movements.test.ts
  backup.test.ts
```

Todas las páginas que leen IndexedDB son componentes cliente (`"use client"`).

## Plan de implementación

1. Crear el proyecto con `create-next-app` (TypeScript, Tailwind, App Router, carpeta `src/`). Configurar `lang="es"`, viewport móvil y un layout con barra superior. Verificación: `npm run dev` muestra la página vacía en el celular o en DevTools modo móvil.
2. Agregar Vitest y `fake-indexeddb` como dependencias de desarrollo, con script `npm test`. Verificación: un test trivial pasa.
3. Crear `src/lib/types.ts` y `src/lib/db.ts` con Dexie y el esquema versión 1.
4. Implementar `src/lib/expiry.ts` (`DIAS_ALERTA`, `getEstadoVencimiento(fecha, hoy)`) con `tests/expiry.test.ts` cubriendo ayer, hoy, hoy+30, hoy+31.
5. Implementar `src/lib/products.ts`: `crearProducto` (con movimiento de stock inicial), `actualizarProducto` (sin tocar cantidad) y `eliminarProducto` (borra producto y movimientos en una transacción).
6. Implementar `src/lib/movements.ts`: `registrarMovimiento` en transacción; lanza error si la salida supera el stock o la cantidad no es > 0. Tests en `tests/movements.test.ts`.
7. Crear `StarRating`, `ExpiryBadge` y `ProductForm` (validación de campos obligatorios y números ≥ 0; sugerencias de categoría con `<datalist>`).
8. Página `productos/nuevo`: guarda y redirige al detalle.
9. Página principal: lista de `ProductCard` ordenada por fecha de vencimiento ascendente, con `useLiveQuery`. Estado vacío con botón "Agregar producto".
10. Componente `ExpirySummary` en la página principal con los conteos de vencidos y por vencer. Tocar un contador aplica ese filtro.
11. Componente `Filters`: búsqueda por nombre (sin distinguir mayúsculas ni tildes), categoría, calidad mínima y estado de vencimiento. Botón "Limpiar filtros".
12. Página de detalle `productos/[id]`: todos los campos, `ExpiryBadge`, botones Editar y Eliminar. Si el id no existe, muestra "Producto no encontrado" con enlace a la lista.
13. `MovementForm` y `MovementList` en el detalle: registrar entrada/salida y ver historial más reciente primero. El error de stock insuficiente se muestra bajo el formulario.
14. Página `productos/[id]/editar` reutilizando `ProductForm` sin el campo cantidad.
15. `ConfirmDialog` y eliminación desde el detalle; tras eliminar vuelve a la lista.
16. Implementar `src/lib/backup.ts`: `exportarDatos()`, `validarRespaldo(json)` e `importarDatos(respaldo)` que reemplaza todo en una transacción. Tests en `tests/backup.test.ts`.
17. Página `ajustes`: botón "Exportar" descarga `inventario-YYYY-MM-DD.json`; botón "Importar" pide confirmación ("reemplazará todos los datos actuales") y muestra error si el archivo no es válido. Enlace a Ajustes en la barra superior.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] `npm test` pasa todos los tests.
- [ ] A 375 px de ancho ninguna pantalla tiene scroll horizontal.
- [ ] Crear un producto con todos los campos lo muestra en la lista principal.
- [ ] El formulario no guarda si falta nombre, categoría, unidad, calidad o fecha de vencimiento, y muestra el error junto al campo.
- [ ] El formulario rechaza cantidades o precios negativos.
- [ ] Crear un producto con cantidad 10 genera un movimiento `entrada` de 10 con nota "Stock inicial".
- [ ] Un producto con vencimiento ayer muestra la etiqueta roja "Vencido".
- [ ] Un producto con vencimiento hoy o dentro de 30 días muestra la etiqueta amarilla "Por vencer".
- [ ] Un producto con vencimiento en 31 días muestra la etiqueta verde.
- [ ] El resumen principal muestra los conteos correctos de vencidos y por vencer.
- [ ] La lista está ordenada por fecha de vencimiento, la más próxima primero.
- [ ] Buscar "leche" encuentra "Leche Entera" y "LECHÉ" sin distinguir mayúsculas ni tildes.
- [ ] Los filtros de categoría, calidad mínima y estado se combinan entre sí.
- [ ] Registrar una entrada de 5 sobre stock 10 deja el stock en 15 y aparece en el historial.
- [ ] Registrar una salida de 20 sobre stock 15 se rechaza con mensaje y el stock sigue en 15.
- [ ] Editar un producto cambia sus datos pero no su cantidad.
- [ ] Eliminar un producto pide confirmación; al confirmar desaparecen el producto y sus movimientos.
- [ ] Recargar la página conserva todos los productos y movimientos.
- [ ] Exportar descarga un `.json` con `app: "inventario"`, `version: 1`, productos y movimientos.
- [ ] Importar ese archivo en un navegador limpio restaura exactamente los mismos datos.
- [ ] Importar un archivo inválido muestra un error y no modifica los datos existentes.
- [ ] Abrir `/productos/id-inexistente` muestra "Producto no encontrado".

## Decisiones

- **Sí:** Next.js + TypeScript + Tailwind. Elegido por el usuario.
- **No:** React Native/Expo o Flutter. El usuario prefiere stack web.
- **Sí:** web normal sin PWA. Decisión del usuario; la PWA queda para otra spec.
- **Sí:** IndexedDB con Dexie. Permite índices por vencimiento y categoría, y `useLiveQuery` refresca la UI sola.
- **No:** localStorage. Límite de ~5 MB y sin consultas.
- **No:** backend o nube. Un solo usuario y sin login no lo necesitan todavía.
- **Sí:** calidad como 1–5 estrellas. Elegido por el usuario; filtrable como "calidad mínima".
- **No:** grados A/B/C, estado físico o texto libre para la calidad.
- **Sí:** un vencimiento por registro. Más simple; otro lote es otro producto.
- **No:** varios lotes por producto. Más realista para distribuidores, pero se pospone.
- **Sí:** alertas solo visuales con umbral fijo de 30 días.
- **No:** notificaciones push. Sin PWA ni servidor no son viables.
- **Sí:** Entrada/Salida sin stock negativo. Mantiene el historial coherente con la cantidad.
- **No:** tipo Ajuste. Se pospone.
- **Sí:** la cantidad solo cambia por movimientos, incluido un movimiento "Stock inicial". Así el historial siempre explica el stock actual.
- **Sí:** borrado total con confirmación. **No:** archivar.
- **Sí:** respaldo JSON con `version: 1`. Protege contra la pérdida de datos del navegador y permite migrar el formato.
- **Sí:** importar reemplaza todo (no fusiona). Evita conflictos de ids duplicados.
- **Sí:** categoría como texto libre con sugerencias. **No:** tabla de categorías gestionable.
- **Sí:** precios sin símbolo de moneda. No se definió país ni moneda.
- **Sí:** Vitest + fake-indexeddb para la lógica de `src/lib`. Las pantallas se verifican a mano.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El usuario borra datos del navegador o cambia de celular y pierde el inventario | Exportar/Importar JSON en Ajustes. |
| Safari en iOS puede borrar IndexedDB de sitios no usados en 7 días | Documentado; recomendar exportar seguido. La PWA (spec futura) reduce el riesgo. |
| Errores de zona horaria al comparar fechas de vencimiento | Fechas guardadas como `YYYY-MM-DD` y comparadas en hora local con tests de borde. |
| Cambios futuros al esquema | Versión de Dexie y campo `version` en el respaldo permiten migraciones. |
| Importar un JSON corrupto | `validarRespaldo` revisa la estructura antes de tocar la base; la importación es transaccional. |

## Lo que **no** está en esta spec

- PWA, modo offline y notificaciones push.
- Nube, sincronización, login y roles.
- Varios lotes por producto y movimientos de Ajuste.
- SKU, lote, proveedor, notas, foto y escaneo de códigos.
- Archivar productos, umbral configurable, reportes y moneda.

Cada uno, si llega, va en su propia spec.
