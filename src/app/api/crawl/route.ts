import { NextRequest, NextResponse } from 'next/server';
import { crawlRecipes, crawlPopularRecipes } from '@/lib/crawler/mangae';

// 레시피 크롤링 API (관리자용)
export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (간단한 보안)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.CRAWL_API_KEY && process.env.CRAWL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, keywords, limit } = body;

    let recipes;

    if (type === 'popular') {
      recipes = await crawlPopularRecipes(limit || 20);
    } else if (type === 'search' && keywords) {
      recipes = await crawlRecipes(keywords, limit || 5);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error('Crawl error:', error);
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
