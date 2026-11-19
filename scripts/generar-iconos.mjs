// Genera los íconos PNG de la PWA a partir de public/icons/icon.svg.
// Uso: npm run iconos
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const FONDO = "#059669";
const svg = await readFile(new URL("../public/icons/icon.svg", import.meta.url));

async function normal(tamano, destino) {
  await sharp(svg, { density: 384 }).resize(tamano, tamano).png().toFile(destino);
  console.log(`✓ ${destino} (${tamano}×${tamano})`);
}

/** Maskable: el dibujo ocupa el 60 % central (margen de seguridad del 20 % por lado) y el fondo llena todo. */
async function maskable(tamano, destino) {
  const interior = Math.round(tamano * 0.6);
  const dibujo = await sharp(svg, { density: 384 }).resize(interior, interior).png().toBuffer();
  await sharp({ create: { width: tamano, height: tamano, channels: 4, background: FONDO } })
    .composite([{ input: dibujo, gravity: "center" }])
    .png()
    .toFile(destino);
  console.log(`✓ ${destino} (${tamano}×${tamano}, maskable)`);
}

/** iPhone no admite transparencia: fondo sólido sin esquinas redondeadas (iOS las redondea). */
async function apple(tamano, destino) {
  const dibujo = await sharp(svg, { density: 384 }).resize(tamano, tamano).png().toBuffer();
  await sharp({ create: { width: tamano, height: tamano, channels: 4, background: FONDO } })
    .composite([{ input: dibujo }])
    .flatten({ background: FONDO })
    .png()
    .toFile(destino);
  console.log(`✓ ${destino} (${tamano}×${tamano}, iPhone)`);
}

await normal(192, "public/icons/icon-192.png");
await normal(512, "public/icons/icon-512.png");
await maskable(512, "public/icons/icon-maskable-512.png");
await apple(180, "src/app/apple-icon.png");
