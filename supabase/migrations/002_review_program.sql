-- 후기 프로그램 제출 테이블
CREATE TABLE IF NOT EXISTS review_program_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  blog_url TEXT NOT NULL,
  nickname TEXT,
  note TEXT,
  source TEXT,
  user_plan_snapshot TEXT DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'submitted',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE review_program_submissions ENABLE ROW LEVEL SECURITY;

-- 서비스 역할만 접근 (admin client로만 CRUD)
CREATE POLICY "Service role full access on review_program_submissions"
  ON review_program_submissions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 본인 제출 내역 조회 허용
CREATE POLICY "Users can view own submissions"
  ON review_program_submissions
  FOR SELECT
  USING (auth.uid() = user_id);
