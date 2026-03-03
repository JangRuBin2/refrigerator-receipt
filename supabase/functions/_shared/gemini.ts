const GEMINI_API_KEY = () => Deno.env.get('GOOGLE_GEMINI_API_KEY') ?? '';

interface GeminiContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

// OpenAPI 3.0 subset supported by Gemini responseSchema
export type GeminiSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
  enum?: string[];
  description?: string;
  nullable?: boolean;
};

interface GeminiOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  responseSchema?: GeminiSchema;
}

interface GeminiImageOptions extends GeminiOptions {
  mimeType?: string;
}

function buildGenerationConfig(options?: GeminiOptions): Record<string, unknown> {
  const config: Record<string, unknown> = {
    maxOutputTokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
  };

  if (options?.jsonMode || options?.responseSchema) {
    config.responseMimeType = 'application/json';
  }

  if (options?.responseSchema) {
    config.responseSchema = options.responseSchema;
  }

  return config;
}

export async function callGemini(
  prompt: string,
  options?: GeminiOptions
): Promise<string> {
  const model = options?.model ?? 'gemini-2.0-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: buildGenerationConfig(options),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function callGeminiWithImage(
  prompt: string,
  imageBase64: string,
  options?: GeminiImageOptions
): Promise<string> {
  const model = options?.model ?? 'gemini-2.0-flash';
  const mimeType = options?.mimeType ?? 'image/jpeg';

  const parts: GeminiContentPart[] = [
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: buildGenerationConfig({
          ...options,
          temperature: options?.temperature ?? 0.1,
        }),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export function parseJsonFromText(text: string): unknown {
  let jsonStr = text.trim();

  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try full string first (preserves outer object structure)
  try {
    return JSON.parse(jsonStr);
  } catch { /* fall through */ }

  // Try object extraction (prioritize over array to avoid extracting inner arrays)
  const objStart = jsonStr.indexOf('{');
  const objEnd = jsonStr.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1) {
    try {
      return JSON.parse(jsonStr.slice(objStart, objEnd + 1));
    } catch { /* fall through */ }
  }

  // Try array extraction
  const arrayStart = jsonStr.indexOf('[');
  const arrayEnd = jsonStr.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1) {
    try {
      return JSON.parse(jsonStr.slice(arrayStart, arrayEnd + 1));
    } catch { /* fall through */ }
  }

  // Final fallback - will throw if not valid JSON
  return JSON.parse(jsonStr);
}
