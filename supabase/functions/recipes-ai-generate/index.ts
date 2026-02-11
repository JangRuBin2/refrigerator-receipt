import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { callGemini, parseJsonFromText } from '../_shared/gemini.ts';
import { checkAccess } from '../_shared/free-trial.ts';
import { Recipe, RecipeSchema } from '../_shared/types.ts';

interface GenerateRequest {
  ingredients: string[];
  preferences?: {
    cookingTime?: 'quick' | 'medium' | 'long';
    difficulty?: 'easy' | 'medium' | 'hard';
    cuisine?: string;
    dietary?: string[];
  };
  locale?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium/free trial
    const access = await checkAccess(supabase, user.id, 'ai_recipe_generate');
    if (!access.hasAccess) {
      return new Response(
        JSON.stringify({
          error: '무료 체험 횟수를 모두 사용했습니다. 프리미엄으로 업그레이드해주세요.',
          freeTrial: access.freeTrial,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GenerateRequest = await req.json();
    const { ingredients, preferences, locale = 'ko' } = body;

    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildPrompt(ingredients, preferences, locale);
    const generatedText = await callGemini(prompt, { temperature: 0.7, maxTokens: 2048 });

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipe = parseRecipeResponse(generatedText);

    if (!recipe) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log event
    await supabase.from('event_logs').insert({
      user_id: user.id,
      event_type: 'ai_recipe_generate',
      metadata: {
        ingredients,
        preferences,
        recipe_title: recipe.title,
      },
    });

    // Recheck access for updated trial count
    const updatedAccess = await checkAccess(supabase, user.id, 'ai_recipe_generate');

    return new Response(
      JSON.stringify({
        recipe,
        freeTrial: updatedAccess.freeTrial,
        isPremium: updatedAccess.isPremium,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  ingredients: string[],
  preferences?: GenerateRequest['preferences'],
  locale?: string
): string {
  const langMap: Record<string, string> = {
    ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
  };
  const language = langMap[locale || 'ko'] || '한국어';

  const cookingTimeMap: Record<string, string> = {
    quick: '15분 이내', medium: '30분 이내', long: '60분 이상',
  };
  const difficultyMap: Record<string, string> = {
    easy: '쉬움 (초보자도 가능)', medium: '보통', hard: '어려움 (숙련자용)',
  };

  let constraints = '';
  if (preferences) {
    if (preferences.cookingTime) constraints += `- 조리 시간: ${cookingTimeMap[preferences.cookingTime]}\n`;
    if (preferences.difficulty) constraints += `- 난이도: ${difficultyMap[preferences.difficulty]}\n`;
    if (preferences.cuisine) constraints += `- 요리 종류: ${preferences.cuisine}\n`;
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
  "description": "요리에 대한 간단한 설명",
  "cookingTime": 조리시간(분),
  "difficulty": "easy|medium|hard",
  "servings": 인분(숫자),
  "ingredients": [{"name": "재료명", "quantity": "양"}],
  "instructions": ["1단계", "2단계"],
  "tips": "요리 팁"
}
\`\`\`

JSON만 응답하세요.`;
}

function parseRecipeResponse(text: string): Recipe | null {
  try {
    const parsed = parseJsonFromText(text) as Record<string, unknown>;
    const result = RecipeSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}
