-- Allow anonymous (non-authenticated) users to view recipes for sharing
-- recipes table contains no PII; it's a global catalog table
CREATE POLICY "Anyone can view recipes for sharing"
  ON public.recipes FOR SELECT USING (true);
