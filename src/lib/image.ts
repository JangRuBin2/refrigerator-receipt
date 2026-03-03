/**
 * 클라이언트 이미지 압축 유틸리티
 * 영수증 스캔 전 이미지를 리사이즈하여 API 비용 절감
 * 1.2MB PNG → ~150KB JPEG (토큰 87% 절감)
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1600;
const JPEG_QUALITY = 0.8;

interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressImageForScan(file: File): Promise<CompressResult> {
  const originalSize = file.size;

  // JPEG이고 이미 작으면 그대로 반환
  if (file.type === 'image/jpeg' && file.size <= 300 * 1024) {
    return { file, originalSize, compressedSize: file.size, width: 0, height: 0 };
  }

  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // 리사이즈 비율 계산
  let width = origW;
  let height = origH;
  if (width > MAX_WIDTH) {
    height = Math.round(height * (MAX_WIDTH / width));
    width = MAX_WIDTH;
  }
  if (height > MAX_HEIGHT) {
    width = Math.round(width * (MAX_HEIGHT / height));
    height = MAX_HEIGHT;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { file, originalSize, compressedSize: file.size, width: origW, height: origH };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });

  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
    width,
    height,
  };
}
