// Google Cloud Vision API를 사용한 OCR
// 서버 사이드에서만 실행

interface VisionApiResponse {
  responses: {
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }[];
}

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;

  if (!credentials) {
    throw new Error('Google Cloud credentials not configured');
  }

  const parsedCredentials = JSON.parse(credentials);
  const accessToken = await getAccessToken(parsedCredentials);

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
            imageContext: {
              languageHints: ['ko', 'en'],
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.statusText}`);
  }

  const data: VisionApiResponse = await response.json();

  if (data.responses[0]?.error) {
    throw new Error(data.responses[0].error.message);
  }

  return data.responses[0]?.fullTextAnnotation?.text || '';
}

// 서비스 계정으로 액세스 토큰 발급
async function getAccessToken(credentials: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-vision',
  };

  // JWT 생성 (edge runtime 호환)
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await signRS256(signatureInput, credentials.private_key);
  const jwt = `${signatureInput}.${signature}`;

  // 토큰 교환
  const tokenResponse = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signRS256(input: string, privateKey: string): Promise<string> {
  // PEM 형식에서 키 추출
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(input)
  );

  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}
