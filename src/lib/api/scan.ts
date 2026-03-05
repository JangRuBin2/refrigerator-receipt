import { callEdgeFunction } from './edge';
import { compressImageForScan } from '@/lib/image';

interface ScanResponseItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  confidence?: number;
  estimatedExpiryDays?: number;
}

interface ScanResponse {
  items: ScanResponseItem[];
  mode: string;
  rawText?: string;
  scanId?: string;
  usage?: { dailyLimit: number; used: number; remaining: number };
}

export async function scanReceipt(file: File, useAIVision = false) {
  const compressed = await compressImageForScan(file);
  const scanFile = compressed.file;

  const base64 = await fileToBase64(scanFile);
  const mimeType = scanFile.type || 'image/jpeg';

  const result = await callEdgeFunction('receipts-scan', {
    body: { image: base64, mimeType, useAIVision },
  });

  return result;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
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
