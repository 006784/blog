-- 算法练习题库：题目、测试用例、提交记录
CREATE TABLE IF NOT EXISTS practice_problems (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text         NOT NULL,
  slug             text         UNIQUE NOT NULL,
  description      text         NOT NULL DEFAULT '',
  difficulty       text         NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  type             text         NOT NULL DEFAULT 'algorithm' CHECK (type IN ('algorithm','multiple_choice','interview')),
  tags             text[]       NOT NULL DEFAULT '{}',
  is_public        boolean      NOT NULL DEFAULT true,
  submission_count int          NOT NULL DEFAULT 0,
  accept_count     int          NOT NULL DEFAULT 0,
  sort_order       int          NOT NULL DEFAULT 0,
  languages        text[]       NOT NULL DEFAULT '{python,javascript}',
  starter_code     jsonb        NOT NULL DEFAULT '{}',
  hints            text,
  answer_hint      text,
  choices          jsonb,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_test_cases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  uuid        NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  input       text        NOT NULL DEFAULT '',
  expected    text        NOT NULL DEFAULT '',
  is_hidden   boolean     NOT NULL DEFAULT false,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_submissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  uuid        NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  language    text        NOT NULL DEFAULT 'python',
  code        text        NOT NULL DEFAULT '',
  status      text        NOT NULL DEFAULT 'pending',
  run_time_ms int,
  output      text,
  error_msg   text,
  visitor_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read practice_problems" ON practice_problems FOR SELECT USING (is_public = true);
CREATE POLICY "public read practice_test_cases" ON practice_test_cases FOR SELECT USING (true);
CREATE POLICY "public insert practice_submissions" ON practice_submissions FOR INSERT WITH CHECK (true);
