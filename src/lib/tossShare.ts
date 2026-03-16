/**
 * Toss app share link utilities
 * Uses @apps-in-toss/web-framework for deep link sharing
 *
 * NOTE: intoss:// 스킴은 앱 정식 출시 후에만 동작.
 * 출시 전 테스트는 intoss-private://appsintoss?_deploymentId=XXX 사용.
 */

export function isTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /TossApp/i.test(navigator.userAgent);
}

export async function shareTossRecipeLink(
  recipeId: string,
  locale: string
): Promise<void> {
  const { getTossShareLink, share } = await import('@apps-in-toss/web-framework');

  const deepLink = `intoss://acorn/${locale}/recipe?id=${recipeId}`;
  const tossLink = await getTossShareLink(deepLink);
  await share({ message: tossLink });
}
