import { callEdgeFunction, getLastEdgeDebugInfo, type EdgeFunctionDebugInfo } from './edge';
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

export interface ScanDebugInfo {
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  compression: {
    originalSize: number;
    compressedSize: number;
    ratio: string;
  } | null;
  base64Length: number;
  mimeType: string;
  useAIVision: boolean;
  edgeDebug: EdgeFunctionDebugInfo | null;
  result: unknown | null;
  error: string | null;
}

let _lastScanDebug: ScanDebugInfo | null = null;

export function getLastScanDebugInfo(): ScanDebugInfo | null {
  return _lastScanDebug;
}

export async function scanReceipt(file: File, useAIVision = false) {
  const debug: ScanDebugInfo = {
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
    compression: null,
    base64Length: 0,
    mimeType: file.type || 'image/jpeg',
    useAIVision,
    edgeDebug: null,
    result: null,
    error: null,
  };

  try {
    // 이미지 압축 (1.2MB PNG → ~150KB JPEG)
    const compressed = await compressImageForScan(file);
    const scanFile = compressed.file;
    debug.compression = {
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      ratio: `${Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100)}%`,
    };

    const base64 = await fileToBase64(scanFile);
    debug.base64Length = base64.length;
    const mimeType = scanFile.type || 'image/jpeg';
    debug.mimeType = mimeType;

    const result = await callEdgeFunction('receipts-scan', {
      body: { image: base64, mimeType, useAIVision },
    });

    debug.edgeDebug = getLastEdgeDebugInfo();
    debug.result = result;
    _lastScanDebug = debug;
    return result;
  } catch (err) {
    debug.edgeDebug = getLastEdgeDebugInfo();
    debug.error = err instanceof Error ? err.message : String(err);
    _lastScanDebug = debug;
    throw err;
  }
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
