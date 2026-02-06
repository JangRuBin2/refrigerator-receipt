import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAccess } from '@/lib/subscription/free-trial';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GenerateRequest {
  ingredients: string[];
  preferences?: {
    cookingTime?: 'quick' | 'medium' | 'long'; // 15분, 30분, 60분+
    difficulty?: 'easy' | 'medium' | 'hard';
    cuisine?: string; // 한식, 중식, 양식 등
    dietary?: string[]; // 채식, 저염 등
  };
  locale?: string;
}

interface GeneratedRecipe {
  title: string;
  description: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
  tips?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 프리미엄/무료 체험 체크
    const access = await checkAccess(supabase, user.id, 'ai_recipe_generate');
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: '무료 체험 횟수를 모두 사용했습니다. 프리미엄으로 업그레이드해주세요.',
          freeTrial: access.freeTrial,
        },
        { status: 403 }
      );
    }

    // API 키 체크
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { ingredients, preferences, locale = 'ko' } = body;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients required' },
        { status: 400 }
      );
    }

    // 프롬프트 생성
    const prompt = buildPrompt(ingredients, preferences, locale);

    // Gemini API 호출
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 502 }
      );
    }

    // JSON 파싱
    const recipe = parseRecipeResponse(generatedText);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Failed to parse recipe' },
        { status: 500 }
      );
    }

    // 이벤트 로그 저장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('event_logs') as any).insert({
      user_id: user.id,
      event_type: 'ai_recipe_generate',
      metadata: {
        ingredients,
        preferences,
        recipe_title: recipe.title,
      },
    });

    // 사용 후 남은 횟수 재계산
    const updatedAccess = await checkAccess(supabase, user.id, 'ai_recipe_generate');

    return NextResponse.json({
      recipe,
      freeTrial: updatedAccess.freeTrial,
      isPremium: updatedAccess.isPremium,
    });

  } catch (error) {
    console.error('AI recipe generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildPrompt(
  ingredients: string[],
  preferences?: GenerateRequest['preferences'],
  locale?: string
): string {
  const langMap: Record<string, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文'
  };
  const language = langMap[locale || 'ko'] || '한국어';

  const cookingTimeMap = {
    quick: '15분 이내',
    medium: '30분 이내',
    long: '60분 이상'
  };

  const difficultyMap = {
    easy: '쉬움 (초보자도 가능)',
    medium: '보통',
    hard: '어려움 (숙련자용)'
  };

  let constraints = '';
  if (preferences) {
    if (preferences.cookingTime) {
      constraints += `- 조리 시간: ${cookingTimeMap[preferences.cookingTime]}\n`;
    }
    if (preferences.difficulty) {
      constraints += `- 난이도: ${difficultyMap[preferences.difficulty]}\n`;
    }
    if (preferences.cuisine) {
      constraints += `- 요리 종류: ${preferences.cuisine}\n`;
    }
    if (preferences.dietary && preferences.dietary.length > 0) {
      constraints += `- 식이 제한: ${preferences.dietary.join(', ')}\n`;
    }
  }

  return `당신은 전문 요리사입니다. 주어진 재료로 맛있는 요리 레시피를 만들어주세요.

## 사용 가능한 재료
${ingredients.map(i => `- ${i}`).join('\n')}

## 조건
${constraints || '- 특별한 조건 없음'}

## 요구사항
1. 위 재료를 최대한 활용하세요
2. 없는 재료는 일반적인 조미료(소금, 후추, 식용유 등)만 추가 가능
3. 실제로 만들 수 있는 현실적인 레시피를 제공하세요
4. 응답은 ${language}로 작성하세요

## 응답 형식 (반드시 아래 JSON 형식으로만 응답)
\`\`\`json
{
  "title": "요리 이름",
  "description": "요리에 대한 간단한 설명 (1-2문장)",
  "cookingTime": 조리시간(분 단위 숫자),
  "difficulty": "easy|medium|hard 중 하나",
  "servings": 인분(숫자),
  "ingredients": [
    {"name": "재료명", "quantity": "양 (예: 100g, 2개)"}
  ],
  "instructions": [
    "1단계 설명",
    "2단계 설명"
  ],
  "tips": "요리 팁 (선택사항)"
}
\`\`\`

JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

function parseRecipeResponse(text: string): GeneratedRecipe | null {
  try {
    // JSON 블록 추출
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return null;
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // 필수 필드 검증
    if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
      console.error('Missing required fields:', parsed);
      return null;
    }

    return {
      title: parsed.title,
      description: parsed.description || '',
      cookingTime: parseInt(parsed.cookingTime) || 30,
      difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty)
        ? parsed.difficulty
        : 'medium',
      servings: parseInt(parsed.servings) || 2,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      tips: parsed.tips
    };
  } catch (error) {
    console.error('Failed to parse recipe JSON:', error, text);
    return null;
  }
}
