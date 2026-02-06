-- Event Logs 테이블 (receipt_scans 대체 + 모든 이벤트 통합)
-- 기존 receipt_scans 테이블 삭제
DROP TABLE IF EXISTS public.receipt_scans CASCADE;

-- 통합 이벤트 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  -- event_type 값:
  --   'receipt_scan': 영수증 스캔
  --   'external_recipe_search': 외부 레시피 검색
  --   'ai_recipe_generate': AI 레시피 생성
  --   'random_recipe': 랜덤 레시피 추천
  --   'taste_recipe': 취향 기반 레시피 추천
  --   'nutrition_analyze': 영양 분석
  --   'shopping_recommend': 스마트 장보기 추천
  metadata JSONB DEFAULT '{}',
  -- metadata 예시:
  --   receipt_scan: { raw_text, parsed_items, status, mode }
  --   external_recipe_search: { query, strategy, results_count }
  --   ai_recipe_generate: { ingredients, preferences, recipe_title }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can CRUD own event logs" ON public.event_logs
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_event_logs_user_id ON public.event_logs(user_id);
CREATE INDEX idx_event_logs_event_type ON public.event_logs(event_type);
CREATE INDEX idx_event_logs_user_event_type ON public.event_logs(user_id, event_type);
CREATE INDEX idx_event_logs_created_at ON public.event_logs(created_at);
CREATE INDEX idx_event_logs_user_created ON public.event_logs(user_id, created_at DESC);

-- 무료 체험 횟수 조회용 함수 (선택적)
CREATE OR REPLACE FUNCTION get_free_trial_count(
  p_user_id UUID,
  p_event_type TEXT,
  p_limit INT DEFAULT 3
) RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM public.event_logs
  WHERE user_id = p_user_id
    AND event_type = p_event_type;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
