// 만개의레시피 크롤러
// https://www.10000recipe.com

import * as cheerio from 'cheerio';

export interface CrawledRecipe {
  externalId: string;
  source: 'mangae';
  sourceUrl: string;
  title: { ko: string };
  description?: { ko: string };
  imageUrl?: string;
  cookingTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  servings?: number;
  ingredients: { name: string; quantity?: string }[];
  instructions: { ko: string[] };
  tags?: string[];
}

const BASE_URL = 'https://www.10000recipe.com';
const USER_AGENT = 'FridgeMate-Bot/1.0 (+https://github.com/fridgemate)';
const REQUEST_DELAY = 2000; // 2초 간격

// 요청 딜레이
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 페이지 가져오기
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

// 검색 결과에서 레시피 ID 목록 추출
export async function searchRecipes(keyword: string, page: number = 1): Promise<string[]> {
  const url = `${BASE_URL}/recipe/list.html?q=${encodeURIComponent(keyword)}&order=reco&page=${page}`;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const recipeIds: string[] = [];

    $('.common_sp_link').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const match = href.match(/\/recipe\/(\d+)/);
        if (match) {
          recipeIds.push(match[1]);
        }
      }
    });

    return recipeIds;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// 레시피 상세 정보 크롤링
export async function getRecipeDetail(recipeId: string): Promise<CrawledRecipe | null> {
  const url = `${BASE_URL}/recipe/${recipeId}`;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // 제목
    const title = $('.view2_summary h3').text().trim();
    if (!title) return null;

    // 설명
    const description = $('.view2_summary_in').text().trim();

    // 이미지
    const imageUrl = $('.centeredcrop img').attr('src');

    // 조리 시간
    const timeText = $('.view2_summary_info span:contains("분")').text();
    const cookingTime = parseInt(timeText.match(/(\d+)분/)?.[1] || '0') || undefined;

    // 인분
    const servingsText = $('.view2_summary_info span:contains("인분")').text();
    const servings = parseInt(servingsText.match(/(\d+)인분/)?.[1] || '0') || undefined;

    // 난이도
    const difficultyText = $('.view2_summary_info span:contains("난이도")').next().text();
    let difficulty: 'easy' | 'medium' | 'hard' | undefined;
    if (difficultyText.includes('초보')) difficulty = 'easy';
    else if (difficultyText.includes('중급')) difficulty = 'medium';
    else if (difficultyText.includes('고급')) difficulty = 'hard';

    // 재료
    const ingredients: { name: string; quantity?: string }[] = [];
    $('.ready_ingre3 ul li').each((_, el) => {
      const name = $(el).find('a').text().trim() || $(el).text().trim().split(/\s+/)[0];
      const quantity = $(el).find('.ingre_unit').text().trim();
      if (name && name.length > 0) {
        ingredients.push({ name, quantity: quantity || undefined });
      }
    });

    // 조리법
    const instructions: string[] = [];
    $('.view_step_cont').each((_, el) => {
      const step = $(el).find('.media-body').text().trim();
      if (step) {
        instructions.push(step);
      }
    });

    // 태그
    const tags: string[] = [];
    $('.view_tag a').each((_, el) => {
      const tag = $(el).text().trim().replace('#', '');
      if (tag) tags.push(tag);
    });

    return {
      externalId: recipeId,
      source: 'mangae',
      sourceUrl: url,
      title: { ko: title },
      description: description ? { ko: description } : undefined,
      imageUrl,
      cookingTime,
      difficulty,
      servings,
      ingredients,
      instructions: { ko: instructions },
      tags: tags.length > 0 ? tags : undefined,
    };
  } catch (error) {
    console.error(`Recipe ${recipeId} crawl error:`, error);
    return null;
  }
}

// 여러 레시피 크롤링 (딜레이 포함)
export async function crawlRecipes(
  keywords: string[],
  recipesPerKeyword: number = 5
): Promise<CrawledRecipe[]> {
  const allRecipes: CrawledRecipe[] = [];
  const seenIds = new Set<string>();

  for (const keyword of keywords) {
    const recipeIds = await searchRecipes(keyword);
    await delay(REQUEST_DELAY);

    let count = 0;
    for (const id of recipeIds) {
      if (seenIds.has(id)) continue;
      if (count >= recipesPerKeyword) break;

      const recipe = await getRecipeDetail(id);
      if (recipe) {
        allRecipes.push(recipe);
        seenIds.add(id);
        count++;
      }

      await delay(REQUEST_DELAY);
    }
  }

  return allRecipes;
}

// 인기 레시피 크롤링
export async function crawlPopularRecipes(limit: number = 20): Promise<CrawledRecipe[]> {
  const url = `${BASE_URL}/recipe/list.html?order=reco`;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const recipeIds: string[] = [];

    $('.common_sp_link').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const match = href.match(/\/recipe\/(\d+)/);
        if (match && recipeIds.length < limit) {
          recipeIds.push(match[1]);
        }
      }
    });

    const recipes: CrawledRecipe[] = [];
    for (const id of recipeIds) {
      const recipe = await getRecipeDetail(id);
      if (recipe) {
        recipes.push(recipe);
      }
      await delay(REQUEST_DELAY);
    }

    return recipes;
  } catch (error) {
    console.error('Popular recipes crawl error:', error);
    return [];
  }
}
