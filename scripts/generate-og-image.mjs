/**
 * OG Image Generator (1200x600)
 * Usage: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 600;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ecfdf5" />
      <stop offset="50%" style="stop-color:#d1fae5" />
      <stop offset="100%" style="stop-color:#cffafe" />
    </linearGradient>
    <linearGradient id="cta" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#059669" />
      <stop offset="100%" style="stop-color:#0891b2" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Decorative soft circles -->
  <circle cx="950" cy="100" r="200" fill="#10b981" fill-opacity="0.05" />
  <circle cx="1100" cy="400" r="160" fill="#06b6d4" fill-opacity="0.05" />
  <circle cx="50" cy="550" r="120" fill="#10b981" fill-opacity="0.04" />

  <!-- === Left: Text === -->
  <text x="80" y="195" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="54" font-weight="800" fill="#064e3b">
    냉장고 재료로
  </text>
  <text x="80" y="265" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="54" font-weight="800" fill="#064e3b">
    나만의 레시피를
  </text>
  <text x="80" y="335" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="54" font-weight="800" fill="#064e3b">
    만들어볼까요?
  </text>

  <!-- CTA Button -->
  <rect x="80" y="380" width="240" height="50" rx="25" fill="url(#cta)" />
  <text x="140" y="413" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="22" font-weight="600" fill="white">
    레시피 만들기 &gt;
  </text>

  <!-- === Right: Food Illustrations (SVG shapes) === -->

  <!-- Main: Frying pan -->
  <circle cx="870" cy="240" r="110" fill="white" fill-opacity="0.55" />
  <circle cx="870" cy="250" r="60" fill="#fbbf24" fill-opacity="0.3" />
  <circle cx="870" cy="250" r="45" fill="#f59e0b" fill-opacity="0.4" />
  <circle cx="870" cy="250" r="18" fill="#fbbf24" />
  <!-- pan handle -->
  <rect x="920" y="215" width="70" height="14" rx="7" fill="#78716c" />

  <!-- Carrot (top-left) -->
  <circle cx="740" cy="130" r="52" fill="white" fill-opacity="0.5" />
  <polygon points="740,100 725,165 755,165" fill="#f97316" />
  <line x1="740" y1="100" x2="735" y2="85" stroke="#22c55e" stroke-width="4" stroke-linecap="round" />
  <line x1="740" y1="100" x2="748" y2="83" stroke="#22c55e" stroke-width="4" stroke-linecap="round" />

  <!-- Broccoli (top-right) -->
  <circle cx="1040" cy="150" r="58" fill="white" fill-opacity="0.5" />
  <circle cx="1025" cy="140" r="18" fill="#22c55e" />
  <circle cx="1055" cy="140" r="18" fill="#16a34a" />
  <circle cx="1040" cy="120" r="18" fill="#4ade80" />
  <rect x="1034" y="148" width="12" height="24" rx="4" fill="#65a30d" />

  <!-- Tomato (mid-right) -->
  <circle cx="1080" cy="330" r="50" fill="white" fill-opacity="0.5" />
  <circle cx="1080" cy="335" r="30" fill="#ef4444" />
  <circle cx="1080" cy="335" r="28" fill="#dc2626" />
  <path d="M1070,315 Q1080,308 1090,315" fill="#22c55e" />

  <!-- Rice bowl (bottom-center) -->
  <circle cx="920" cy="420" r="55" fill="white" fill-opacity="0.5" />
  <path d="M890,425 Q905,460 950,425" fill="none" stroke="#78716c" stroke-width="4" />
  <ellipse cx="920" cy="415" rx="32" ry="14" fill="#fef3c7" />
  <ellipse cx="920" cy="415" rx="32" ry="14" fill="none" stroke="#78716c" stroke-width="3" />
  <!-- steam lines -->
  <path d="M908,395 Q905,385 910,375" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" />
  <path d="M920,393 Q917,383 922,373" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" />
  <path d="M932,395 Q929,385 934,375" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" />

  <!-- Onion (bottom-left of illustrations) -->
  <circle cx="750" cy="370" r="44" fill="white" fill-opacity="0.45" />
  <ellipse cx="750" cy="380" rx="25" ry="28" fill="#fde68a" />
  <ellipse cx="750" cy="380" rx="25" ry="28" fill="none" stroke="#d97706" stroke-width="2" />
  <path d="M745,355 Q750,342 755,355" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />

  <!-- === Bottom branding === -->
  <rect x="80" y="510" width="36" height="36" rx="10" fill="#059669" fill-opacity="0.15" />
  <!-- Fridge icon in brand box -->
  <rect x="90" y="518" width="16" height="20" rx="3" fill="none" stroke="#059669" stroke-width="2" />
  <line x1="90" y1="528" x2="106" y2="528" stroke="#059669" stroke-width="1.5" />
  <circle cx="101" cy="524" r="1.5" fill="#059669" />

  <text x="128" y="536" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="18" font-weight="700" fill="#374151">
    밀키퍼
  </text>
  <text x="130" y="556" font-family="'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif" font-size="14" fill="#9ca3af">
    AI 맞춤 레시피
  </text>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(svg))
    .png()
    .toFile('public/og-recipe.png');

  console.log('Generated public/og-recipe.png (1200x600)');
}

generate().catch(console.error);
