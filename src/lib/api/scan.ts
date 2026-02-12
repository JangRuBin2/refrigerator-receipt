import { callEdgeFunction } from './edge';

export async function scanReceipt(file: File, useAIVision: boolean = true) {
  const base64 = await fileToBase64(file);
  return callEdgeFunction<{
    items: unknown[];
    mode: string;
    usage?: { dailyLimit: number; used: number; remaining: number };
  }>('receipts-scan', {
    body: { image: base64, useAIVision },
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
