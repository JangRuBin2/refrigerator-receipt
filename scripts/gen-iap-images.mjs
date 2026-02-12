import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function createSvgOverlay(label, sublabel) {
  return Buffer.from(`
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF7ED;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFEDD5;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EA580C;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="crown" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FBBF24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#00000022"/>
    </filter>
    <filter id="textshadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00000033"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>

  <!-- Subtle pattern circles -->
  <circle cx="180" cy="180" r="120" fill="#F9731608"/>
  <circle cx="850" cy="850" r="160" fill="#F9731608"/>
  <circle cx="800" cy="200" r="80" fill="#FBBF2408"/>

  <!-- Crown icon at top -->
  <g transform="translate(512, 240)" filter="url(#textshadow)">
    <path d="M-60,20 L-45,-30 L-15,0 L0,-40 L15,0 L45,-30 L60,20 Z"
          fill="url(#crown)" stroke="#D97706" stroke-width="3"/>
    <rect x="-55" y="20" width="110" height="15" rx="4" fill="url(#crown)" stroke="#D97706" stroke-width="2"/>
  </g>

  <!-- App name -->
  <text x="512" y="370" text-anchor="middle"
        font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        font-size="72" font-weight="800" fill="#1C1917">밀키퍼</text>

  <!-- PREMIUM text -->
  <text x="512" y="450" text-anchor="middle"
        font-family="'SF Pro Display', 'Inter', sans-serif"
        font-size="48" font-weight="700" letter-spacing="8" fill="#F97316">PREMIUM</text>

  <!-- Divider line -->
  <line x1="362" y1="490" x2="662" y2="490" stroke="#FDBA7440" stroke-width="3" stroke-linecap="round"/>

  <!-- Features list -->
  <g font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" font-size="36" fill="#78716C">
    <text x="512" y="560" text-anchor="middle">무제한 영수증 스캔</text>
    <text x="512" y="610" text-anchor="middle">AI 맞춤 레시피 · 영양 분석</text>
    <text x="512" y="660" text-anchor="middle">스마트 장보기 · 광고 제거</text>
  </g>

  <!-- Bottom badge -->
  <rect x="287" y="730" width="450" height="90" rx="45" fill="url(#badge)" filter="url(#shadow)"/>
  <text x="512" y="788" text-anchor="middle"
        font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        font-size="40" font-weight="700" fill="white">${label}</text>

  <!-- Sub label -->
  <text x="512" y="880" text-anchor="middle"
        font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
        font-size="32" font-weight="500" fill="#A8A29E">${sublabel}</text>

  <!-- Sparkle decorations -->
  <g fill="#FBBF24" opacity="0.6">
    <path transform="translate(160,320) scale(0.8)" d="M12,0 L14,9 L24,12 L14,15 L12,24 L10,15 L0,12 L10,9 Z"/>
    <path transform="translate(830,380) scale(0.6)" d="M12,0 L14,9 L24,12 L14,15 L12,24 L10,15 L0,12 L10,9 Z"/>
    <path transform="translate(200,700) scale(0.5)" d="M12,0 L14,9 L24,12 L14,15 L12,24 L10,15 L0,12 L10,9 Z"/>
    <path transform="translate(820,620) scale(0.7)" d="M12,0 L14,9 L24,12 L14,15 L12,24 L10,15 L0,12 L10,9 Z"/>
  </g>
</svg>`);
}

async function generate() {
  const monthly = createSvgOverlay('월 1,980원', '매월 자동 결제 (VAT 포함)');
  const yearly = createSvgOverlay('연 16,632원', '월 1,386원 · 30% 할인');

  await sharp(monthly)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(root, 'public', 'iap-premium-monthly.png'));

  await sharp(yearly)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(root, 'public', 'iap-premium-yearly.png'));

  console.log('Generated: public/iap-premium-monthly.png');
  console.log('Generated: public/iap-premium-yearly.png');
}

generate().catch(console.error);
