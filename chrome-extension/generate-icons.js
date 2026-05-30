/**
 * Script para generar los iconos PNG de la extensión.
 * Usa canvas nativo de Node.js o sharp si está disponible.
 * Ejecutar: node generate-icons.js (o bun generate-icons.js)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the bookmark icon
function createSvg(size) {
  const strokeWidth = Math.max(1, size / 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#9a73f6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <path d="M64 30 L76.5 55.5 L105 59.5 L84.5 79.5 L89 108 L64 95 L39 108 L43.5 79.5 L23 59.5 L51.5 55.5 Z" 
        fill="white" fill-opacity="0.95"
        stroke="white" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
</svg>`;
}

// Generate SVGs (can be converted to PNG with sharp or an online tool)
const sizes = [16, 48, 128];

for (const size of sizes) {
  const svg = createSvg(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated: icons/icon${size}.svg`);
}

// Try to convert to PNG using sharp (available in the project)
try {
  const sharp = (await import("sharp")).default;

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);
    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer).resize(size, size).png().toFile(pngPath);

    // Remove SVG after converting
    fs.unlinkSync(svgPath);
    console.log(`Converted: icons/icon${size}.png`);
  }

  console.log("\n✅ Iconos PNG generados exitosamente.");
} catch (err) {
  console.log("\n⚠️  sharp no disponible. SVGs generados en icons/.");
  console.log(
    "   Convierte manualmente a PNG o instala sharp: npm install sharp",
  );
}
