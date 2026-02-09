import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const publicDir = path.join(process.cwd(), 'public');

// Full square icon SVG (no border, solid background, large centered fridge)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#FFF7ED"/>

  <g transform="translate(256,256) scale(1.35) translate(-256,-256)">
    <!-- Refrigerator Body -->
    <rect x="156" y="96" width="200" height="320" rx="20" fill="#F97316"/>
    <rect x="166" y="106" width="180" height="300" rx="14" fill="#FDBA74"/>

    <!-- Freezer Section -->
    <rect x="176" y="116" width="160" height="80" rx="8" fill="#FFF7ED"/>
    <rect x="186" y="126" width="140" height="60" rx="4" fill="#FFEDD5"/>

    <!-- Fridge Section -->
    <rect x="176" y="206" width="160" height="190" rx="8" fill="#FFF7ED"/>

    <!-- Shelves -->
    <rect x="186" y="256" width="140" height="4" rx="2" fill="#FDBA74"/>
    <rect x="186" y="316" width="140" height="4" rx="2" fill="#FDBA74"/>

    <!-- Food Items -->
    <circle cx="220" cy="236" r="16" fill="#EF4444"/>
    <path d="M220 220 Q225 210 230 218" stroke="#22C55E" stroke-width="3" fill="none"/>

    <path d="M270 230 L290 250 L280 260 L260 240 Z" fill="#F97316"/>
    <path d="M265 225 Q270 220 275 225" stroke="#22C55E" stroke-width="2" fill="none"/>

    <rect x="210" y="270" width="24" height="36" rx="3" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="2"/>
    <rect x="214" y="278" width="16" height="8" fill="#3B82F6"/>

    <ellipse cx="270" cy="288" rx="12" ry="16" fill="#FEF3C7"/>

    <path d="M250 340 L280 340 L265 370 Z" fill="#FACC15"/>
    <circle cx="260" cy="350" r="3" fill="#FEF9C3"/>
    <circle cx="270" cy="355" r="2" fill="#FEF9C3"/>

    <circle cx="220" cy="350" r="12" fill="#22C55E"/>
    <circle cx="212" cy="345" r="8" fill="#16A34A"/>
    <circle cx="228" cy="345" r="8" fill="#16A34A"/>
    <rect x="217" y="358" width="6" height="12" fill="#15803D"/>

    <!-- Door Handle -->
    <rect x="320" y="180" width="8" height="40" rx="4" fill="#EA580C"/>
    <rect x="320" y="280" width="8" height="40" rx="4" fill="#EA580C"/>

    <!-- Sparkle -->
    <path d="M380 140 L385 155 L400 160 L385 165 L380 180 L375 165 L360 160 L375 155 Z" fill="#FBBF24"/>
    <path d="M140 180 L143 190 L153 193 L143 196 L140 206 L137 196 L127 193 L137 190 Z" fill="#FBBF24"/>
  </g>
</svg>`;

// Simple icon for small sizes (full square, no rounded corners)
const simpleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#F97316"/>

  <!-- Simple Fridge -->
  <rect x="156" y="80" width="200" height="352" rx="24" fill="white"/>

  <!-- Freezer line -->
  <line x1="156" y1="180" x2="356" y2="180" stroke="#F97316" stroke-width="4"/>

  <!-- Handle -->
  <rect x="316" y="120" width="12" height="40" rx="6" fill="#F97316"/>
  <rect x="316" y="220" width="12" height="60" rx="6" fill="#F97316"/>

  <!-- Food icons -->
  <circle cx="220" cy="260" r="20" fill="#EF4444"/>
  <circle cx="290" cy="280" r="16" fill="#22C55E"/>
  <rect x="240" y="320" width="32" height="48" rx="4" fill="#3B82F6"/>
</svg>`;

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating icons...');

  for (const { name, size } of sizes) {
    // Use simple icon for small sizes
    const svg = size <= 96 ? simpleIconSvg : logoSvg;

    const outputPath = path.join(publicDir, name);

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Created: ${name} (${size}x${size})`);
  }

  // icon-600.png
  await sharp(Buffer.from(logoSvg))
    .resize(600, 600)
    .png()
    .toFile(path.join(publicDir, 'icon-600.png'));
  console.log('Created: icon-600.png (600x600)');

  // OG Image (1200x630)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFF7ED"/>
        <stop offset="50%" style="stop-color:#FFEDD5"/>
        <stop offset="100%" style="stop-color:#FED7AA"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>

    <!-- Logo -->
    <rect x="500" y="80" width="200" height="200" rx="40" fill="#F97316"/>
    <rect x="540" y="100" width="120" height="160" rx="16" fill="white"/>
    <line x1="540" y1="150" x2="660" y2="150" stroke="#F97316" stroke-width="3"/>
    <rect x="620" y="120" width="8" height="20" rx="4" fill="#F97316"/>
    <rect x="620" y="170" width="8" height="30" rx="4" fill="#F97316"/>
    <circle cx="580" cy="200" r="12" fill="#EF4444"/>
    <circle cx="620" cy="210" r="10" fill="#22C55E"/>

    <!-- Text -->
    <text x="600" y="360" text-anchor="middle" font-family="system-ui, sans-serif" font-size="72" font-weight="bold" fill="#1F2937">MealKeeper</text>
    <text x="600" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="600" fill="#F97316">MealKeeper</text>
    <text x="600" y="500" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#6B7280">Smart Fridge Management</text>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Created: og-image.png (1200x630)');

  // Favicon.ico
  fs.copyFileSync(
    path.join(publicDir, 'favicon-32x32.png'),
    path.join(publicDir, 'favicon.ico')
  );
  console.log('Created: favicon.ico');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
