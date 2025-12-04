const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Original SVG dimensions and proportions
const ORIGINAL_SIZE = 32;
const CORNER_RADIUS_RATIO = 5 / 32;  // ~15.6%
const DOT_RADIUS_RATIO = 3.5 / 32;   // ~10.9%
const DOT_POSITIONS = [
  { x: 8.5 / 32, y: 8.5 / 32 },   // top-left
  { x: 23.5 / 32, y: 8.5 / 32 },  // top-right
  { x: 16 / 32, y: 16 / 32 },     // center
  { x: 8.5 / 32, y: 23.5 / 32 },  // bottom-left
  { x: 23.5 / 32, y: 23.5 / 32 }, // bottom-right
];

function generateSvg(size, padding = 0) {
  // For maskable icons, we add padding and scale down the icon
  const iconSize = size - (padding * 2);
  const offset = padding;

  const cornerRadius = iconSize * CORNER_RADIUS_RATIO;
  const dotRadius = iconSize * DOT_RADIUS_RATIO;

  const dots = DOT_POSITIONS.map(pos => {
    const cx = offset + (pos.x * iconSize);
    const cy = offset + (pos.y * iconSize);
    return `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="#0a0a0a"/>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Background for maskable icons -->
  <rect x="0" y="0" width="${size}" height="${size}" fill="#A3E635"/>

  <!-- Dice body -->
  <rect x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#A3E635"/>

  <!-- Dots for face 5 pattern -->
  ${dots}
</svg>`;
}

async function generateIcon(size, isMaskable) {
  // Maskable icons need ~20% padding (10% on each side)
  const padding = isMaskable ? Math.round(size * 0.1) : 0;
  const svg = generateSvg(size, padding);

  const suffix = isMaskable ? '-maskable' : '';
  const filename = `icon${suffix}-${size}.png`;
  const outputPath = path.join(__dirname, '..', 'public', 'icons', filename);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${filename}`);
}

async function main() {
  // Ensure output directory exists
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate all icon variants
  await Promise.all([
    generateIcon(192, false),
    generateIcon(512, false),
    generateIcon(192, true),
    generateIcon(512, true),
  ]);

  console.log('\nAll icons generated successfully!');
}

main().catch(console.error);
