/** Lado mayor máximo de la foto guardada, en píxeles. */
export const LADO_MAXIMO = 800;
const CALIDAD_JPEG = 0.75;

/**
 * Reduce la imagen a LADO_MAXIMO px y la convierte a JPEG (data URL).
 * Solo funciona en el navegador.
 */
export async function comprimirFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  const bitmap = await createImageBitmap(archivo);
  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");
    ctx.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    return canvas.toDataURL("image/jpeg", CALIDAD_JPEG);
  } finally {
    bitmap.close();
  }
}
