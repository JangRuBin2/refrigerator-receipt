import { NextRequest, NextResponse } from 'next/server';
import { crawlRecipes, crawlPopularRecipes } from '@/lib/crawler/mangae';
import { crawlSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 레시피 크롤링 API (관리자용)
export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (필수)
    const expectedKey = process.env.CRAWL_API_KEY;
    const apiKey = request.headers.get('x-api-key');

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = crawlSchema.parse(body);

    let recipes;

    if (validated.type === 'popular') {
      recipes = await crawlPopularRecipes(validated.limit || 20);
    } else {
      recipes = await crawlRecipes(validated.keywords!, validated.limit || 5);
    }

    return NextResponse.json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Crawl failed',
    }, { status: 500 });
  }
}

// GET: 크롤링 상태 확인
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Recipe crawler is ready. Use POST to start crawling.',
  });
}
