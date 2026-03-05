import type { AIGeneratedRecipe } from '@/features/recommend/types';

/**
 * Canvas API로 레시피를 이미지로 직접 렌더링
 * html-to-image는 토스 WebView에서 빈 이미지를 생성하므로 Canvas 직접 사용
 */
export async function renderRecipeToImage(
  recipe: AIGeneratedRecipe,
  locale: string,
  filename = 'recipe.png'
): Promise<File> {
  const WIDTH = 750;
  const PADDING = 48;
  const contentWidth = WIDTH - PADDING * 2;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // 먼저 높이 계산을 위한 임시 캔버스 (텍스트 측정용)
  canvas.width = WIDTH;
  canvas.height = 4000; // 임시 높이
  ctx.textBaseline = 'top';

  const font = (weight: number, size: number) =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

  // 텍스트 줄바꿈 유틸
  function wrapText(text: string, maxWidth: number, fontSize: number, fontWeight = 400): string[] {
    ctx!.font = font(fontWeight, fontSize);
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';
    for (const char of words) {
      const testLine = currentLine + char;
      if (ctx!.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // 그리기 시작
  let y = PADDING;

  // 높이 계산을 위해 먼저 레이아웃 측정
  function measureLayout(): number {
    let my = PADDING;

    // Badge
    my += 28 + 16;
    // Title
    const titleLines = wrapText(recipe.title, contentWidth, 40, 700);
    my += titleLines.length * 48 + 8;
    // Description
    const descLines = wrapText(recipe.description, contentWidth, 26, 400);
    my += descLines.length * 34 + 20;
    // Meta chips
    my += 32 + 24;
    // Ingredients header
    my += 32 + 12;
    for (const ing of recipe.ingredients) {
      my += 36;
    }
    my += 24;
    // Instructions header
    my += 32 + 12;
    for (const step of recipe.instructions) {
      const cleaned = step.replace(/^\d+\.\s*/, '');
      const stepLines = wrapText(cleaned, contentWidth - 44, 26, 400);
      my += Math.max(stepLines.length * 34, 34) + 12;
    }
    my += 16;
    // Tips
    if (recipe.tips) {
      const tipLines = wrapText(recipe.tips, contentWidth - 40, 24, 400);
      my += tipLines.length * 32 + 28 + 20;
    }
    // Footer
    my += 48 + PADDING;
    return my;
  }

  const totalHeight = measureLayout();
  canvas.height = totalHeight;

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  // === Badge ===
  ctx.font = font(600, 22);
  const badgeText = 'AI Recipe';
  const badgeW = ctx.measureText(badgeText).width + 24;
  const roundRect = (x: number, ry: number, w: number, h: number, r: number) => {
    ctx!.beginPath();
    ctx!.moveTo(x + r, ry);
    ctx!.lineTo(x + w - r, ry);
    ctx!.quadraticCurveTo(x + w, ry, x + w, ry + r);
    ctx!.lineTo(x + w, ry + h - r);
    ctx!.quadraticCurveTo(x + w, ry + h, x + w - r, ry + h);
    ctx!.lineTo(x + r, ry + h);
    ctx!.quadraticCurveTo(x, ry + h, x, ry + h - r);
    ctx!.lineTo(x, ry + r);
    ctx!.quadraticCurveTo(x, ry, x + r, ry);
    ctx!.closePath();
  };
  roundRect(PADDING, y, badgeW, 28, 14);
  ctx.fillStyle = '#d1fae5';
  ctx.fill();
  ctx.fillStyle = '#059669';
  ctx.fillText(badgeText, PADDING + 12, y + 3);
  y += 28 + 16;

  // === Title ===
  ctx.fillStyle = '#111827';
  ctx.font = font(700, 40);
  const titleLines = wrapText(recipe.title, contentWidth, 40, 700);
  for (const line of titleLines) {
    ctx.fillText(line, PADDING, y);
    y += 48;
  }
  y += 8;

  // === Description ===
  ctx.fillStyle = '#6b7280';
  ctx.font = font(400, 26);
  const descLines = wrapText(recipe.description, contentWidth, 26, 400);
  for (const line of descLines) {
    ctx.fillText(line, PADDING, y);
    y += 34;
  }
  y += 20;

  // === Meta Chips ===
  const diffLabel = locale === 'ko'
    ? { easy: '쉬움', medium: '보통', hard: '어려움' }[recipe.difficulty]
    : recipe.difficulty;
  const servingsLabel = locale === 'ko' ? `${recipe.servings}인분` : `${recipe.servings} servings`;
  const chips = [`${recipe.cookingTime}min`, diffLabel ?? recipe.difficulty, servingsLabel];
  ctx.font = font(400, 22);
  let chipX = PADDING;
  for (const chip of chips) {
    const chipW = ctx.measureText(chip).width + 20;
    roundRect(chipX, y, chipW, 30, 15);
    ctx.fillStyle = '#f3f4f6';
    ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.fillText(chip, chipX + 10, y + 4);
    chipX += chipW + 10;
  }
  y += 32 + 24;

  // === Ingredients ===
  ctx.fillStyle = '#111827';
  ctx.font = font(600, 28);
  ctx.fillText(locale === 'ko' ? '재료' : 'Ingredients', PADDING, y);
  y += 32 + 12;

  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i];
    if (i % 2 === 0) {
      roundRect(PADDING - 4, y - 4, contentWidth + 8, 34, 6);
      ctx.fillStyle = '#f9fafb';
      ctx.fill();
    }
    ctx.fillStyle = '#374151';
    ctx.font = font(400, 26);
    ctx.fillText(ing.name, PADDING + 8, y);
    ctx.fillStyle = '#9ca3af';
    const qw = ctx.measureText(ing.quantity).width;
    ctx.fillText(ing.quantity, WIDTH - PADDING - qw - 8, y);
    y += 36;
  }
  y += 24;

  // === Instructions ===
  ctx.fillStyle = '#111827';
  ctx.font = font(600, 28);
  ctx.fillText(locale === 'ko' ? '만드는 법' : 'Instructions', PADDING, y);
  y += 32 + 12;

  for (let i = 0; i < recipe.instructions.length; i++) {
    const step = recipe.instructions[i].replace(/^\d+\.\s*/, '');
    const stepNum = String(i + 1);

    // 번호 원형 배경
    ctx.beginPath();
    ctx.arc(PADDING + 14, y + 14, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = font(600, 22);
    const numW = ctx.measureText(stepNum).width;
    ctx.fillText(stepNum, PADDING + 14 - numW / 2, y + 4);

    // 스텝 텍스트
    ctx.fillStyle = '#374151';
    ctx.font = font(400, 26);
    const stepLines = wrapText(step, contentWidth - 44, 26, 400);
    for (let j = 0; j < stepLines.length; j++) {
      ctx.fillText(stepLines[j], PADDING + 36, y + j * 34);
    }
    y += Math.max(stepLines.length * 34, 34) + 12;
  }
  y += 16;

  // === Tips ===
  if (recipe.tips) {
    const tipLines = wrapText(recipe.tips, contentWidth - 40, 24, 400);
    const tipH = tipLines.length * 32 + 24;
    roundRect(PADDING, y, contentWidth, tipH, 12);
    ctx.fillStyle = '#ecfdf5';
    ctx.fill();
    ctx.fillStyle = '#065f46';
    ctx.font = font(400, 24);
    for (let i = 0; i < tipLines.length; i++) {
      ctx.fillText((i === 0 ? 'Tip: ' : '') + tipLines[i], PADDING + 20, y + 12 + i * 32);
    }
    y += tipH + 20;
  }

  // === Footer ===
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
  y += 16;

  ctx.fillStyle = '#059669';
  ctx.font = font(600, 24);
  ctx.fillText('MealKeeper', PADDING, y);

  ctx.fillStyle = '#9ca3af';
  ctx.font = font(400, 20);
  const footerRight = locale === 'ko' ? 'AI가 생성한 레시피입니다' : 'AI-generated recipe';
  const frW = ctx.measureText(footerRight).width;
  ctx.fillText(footerRight, WIDTH - PADDING - frW, y + 2);

  // Canvas -> File
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      1.0
    );
  });

  return new File([blob], filename, { type: 'image/png' });
}

/**
 * File -> base64 문자열 (data: prefix 제거)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64 ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 파일을 디바이스에 저장
 * - 토스 앱: saveBase64Data (네이티브 파일 저장)
 * - 웹 브라우저: <a download> fallback
 */
export async function saveImageToDevice(file: File): Promise<void> {
  try {
    const { saveBase64Data } = await import('@apps-in-toss/web-framework');
    const base64 = await fileToBase64(file);
    await saveBase64Data({
      data: base64,
      fileName: file.name,
      mimeType: 'image/png',
    });
    return;
  } catch {
    // saveBase64Data 미지원 환경 -> fallback
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 이미지 파일을 Web Share API로 공유
 * 미지원 시 저장 fallback
 */
export async function shareImage(
  file: File,
  title?: string
): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title,
        files: [file],
      });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
    }
  }

  await saveImageToDevice(file);
  return true;
}
