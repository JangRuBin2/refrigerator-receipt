/**
 * Toss app share link utilities
 * Uses @apps-in-toss/web-framework for deep link sharing
 *
 * NOTE: intoss:// 스킴은 앱 정식 출시 후에만 동작.
 * 출시 전 테스트는 intoss-private://appsintoss?_deploymentId=XXX 사용.
 */

const APP_NAME = 'acorn';

// OG 이미지 (Supabase Storage public bucket)
const OG_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/og-image/share.png`;

export function isTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /TossApp/i.test(navigator.userAgent);
}

/**
 * 토스 딥링크로 레시피 공유
 * - path param 방식 사용 (쿼리 파라미터는 Toss _deploymentId와 충돌)
 * - OG 이미지 포함
 * - 토스 환경이 아니면 Web Share API / clipboard fallback
 */
export async function shareTossRecipeLink(
  recipeId: string,
  locale: string,
  recipeTitle?: string,
): Promise<'shared' | 'copied' | 'failed'> {
  // 토스 환경: getTossShareLink + share
  if (isTossEnvironment()) {
    try {
      const { getTossShareLink, share } = await import('@apps-in-toss/web-framework');

      // path param 방식: /locale/recipe/recipeId (쿼리 파라미터 충돌 방지)
      const deepLink = `intoss://${APP_NAME}/${locale}/recipe/${recipeId}`;
      const tossLink = await getTossShareLink(deepLink, OG_IMAGE_URL);
      const message = recipeTitle
        ? `${recipeTitle} - 밀키퍼 AI 레시피를 확인해보세요!\n${tossLink}`
        : `AI가 만든 맞춤 레시피를 확인해보세요!\n${tossLink}`;
      await share({ message });
      return 'shared';
    } catch {
      // SDK 실패 시 fallback
    }
  }

  // 브라우저/테스트: Web Share API
  const shareUrl = `${window.location.origin}/${locale}/recipe?id=${recipeId}`;
  const shareData: ShareData = {
    title: recipeTitle || '밀키퍼 AI 레시피',
    text: 'AI가 만든 맞춤 레시피를 확인해보세요!',
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return 'shared';
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'failed';
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(shareUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
