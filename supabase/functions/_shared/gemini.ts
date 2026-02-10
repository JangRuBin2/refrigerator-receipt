const GEMINI_API_KEY = () => Deno.env.get('GOOGLE_GEMINI_API_KEY') ?? '';

interface GeminiContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export async function callGemini(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const model = options?.model ?? 'gemini-2.0-flash';
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.7;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
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
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    mimeType?: string;
  }
): Promise<string> {
  const model = options?.model ?? 'gemini-2.0-flash';
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.1;
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
        generationConfig: { maxOutputTokens: maxTokens, temperature },
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

  // Try array
  const arrayStart = jsonStr.indexOf('[');
  const arrayEnd = jsonStr.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1) {
    try {
      return JSON.parse(jsonStr.slice(arrayStart, arrayEnd + 1));
    } catch { /* fall through */ }
  }

  // Try object
  const objStart = jsonStr.indexOf('{');
  const objEnd = jsonStr.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1) {
    return JSON.parse(jsonStr.slice(objStart, objEnd + 1));
  }

  return JSON.parse(jsonStr);
}
