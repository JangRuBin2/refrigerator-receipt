import { toPng } from 'html-to-image';

/**
 * HTML 요소를 PNG 이미지로 캡처하여 File 객체로 반환
 */
export async function captureElementAsImage(
  element: HTMLElement,
  filename = 'recipe.png'
): Promise<File> {
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/png' });
}

/**
 * 이미지 파일을 Web Share API로 공유 (파일 공유 지원 시)
 * 미지원 시 다운로드 fallback
 */
export async function shareImage(
  file: File,
  title?: string
): Promise<boolean> {
  // Web Share API Level 2 (파일 공유)
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

  // Fallback: 이미지 다운로드
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
