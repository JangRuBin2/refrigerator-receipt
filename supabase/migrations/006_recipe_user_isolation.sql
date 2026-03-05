-- 006: Recipe User Isolation
-- AI 생성 레시피를 사용자별로 격리하기 위한 마이그레이션
-- 공개 카탈로그 레시피(source != 'ai')는 기존처럼 전체 공개 유지

-- 1. recipes 테이블에 created_by 컬럼 추가
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. created_by 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes(created_by);

-- 3. 기존 RLS 정책 제거
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Anyone can view recipes for sharing" ON public.recipes;
DROP POLICY IF EXISTS "Service role can manage recipes" ON public.recipes;

-- 4. 새 RLS 정책: SELECT
-- 공개 카탈로그 레시피는 모든 인증 사용자가 조회 가능
-- AI 생성 레시피는 본인만 조회 가능
CREATE POLICY "Users can view public recipes" ON public.recipes
  FOR SELECT USING (
    (source IS DISTINCT FROM 'ai')
    OR (created_by = auth.uid())
  );

-- 5. 새 RLS 정책: INSERT
-- 인증 사용자는 자신의 레시피만 삽입 가능
CREATE POLICY "Users can insert own recipes" ON public.recipes
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND (created_by = auth.uid())
  );

-- 6. 새 RLS 정책: UPDATE
-- 본인 레시피만 수정 가능
CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (created_by = auth.uid());

-- 7. 새 RLS 정책: DELETE
-- 본인 레시피만 삭제 가능
CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (created_by = auth.uid());

-- 8. Service role은 모든 작업 가능 (크롤링, 관리 등)
CREATE POLICY "Service role can manage all recipes" ON public.recipes
  FOR ALL USING (auth.role() = 'service_role');
