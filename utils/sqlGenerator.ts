
export const generateSeedSQL = () => {
  return `-- QuizMaster Pro - Enterprise Migration Script
-- Purpose: Support manual grading, student identity login, and question reordering.
-- This script is idempotent and preserves all existing quiz and student data.

-- 1. ENHANCE QUIZZES TABLE
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "requiresManualGrading" BOOLEAN DEFAULT FALSE;

-- Data Migration: Mark existing quizzes as requiring manual grading if they contain text questions
UPDATE quizzes 
SET "requiresManualGrading" = true 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(questions) AS q 
  WHERE q->>'type' = 'text'
);

-- 2. ENHANCE SUBMISSIONS TABLE
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "studentEmail" TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'graded'; -- 'pending' or 'graded'
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "manualScores" JSONB DEFAULT '{}'::jsonb;

-- Data Migration: Split studentName into firstName/lastName for existing records
UPDATE submissions 
SET 
  "firstName" = split_part("studentName", ' ', 1),
  "lastName" = CASE 
                 WHEN strpos("studentName", ' ') > 0 
                 THEN substr("studentName", strpos("studentName", ' ') + 1)
                 ELSE 'N/A' 
               END
WHERE "firstName" IS NULL;

-- Default status to 'graded' for legacy records to prevent them appearing in grading queue
UPDATE submissions SET "status" = 'graded' WHERE "status" IS NULL;

-- 3. APP TRANSLATIONS STORAGE
CREATE TABLE IF NOT EXISTS app_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT UNIQUE NOT NULL,
  bundle JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Seed/Update translations
INSERT INTO app_translations (language, bundle)
VALUES 
('en', '{
  "studentPortal": "Student Portal",
  "firstName": "First Name",
  "lastName": "Last Name",
  "phone": "Phone Number",
  "manualGrading": "Needs Manual Grading",
  "gradeNow": "Grade Submissions",
  "quizNotStarted": "Assessment Not Started",
  "quizEnded": "Assessment Ended"
}'),
('ar', '{
  "studentPortal": "بوابة الطالب",
  "firstName": "الاسم الأول",
  "lastName": "اسم العائلة",
  "phone": "رقم الهاتف",
  "manualGrading": "يحتاج تصحيح يدوي",
  "gradeNow": "تصحيح الإجابات",
  "quizNotStarted": "الاختبار لم يبدأ بعد",
  "quizEnded": "انتهى وقت الاختبار"
}')
ON CONFLICT (language) DO UPDATE SET bundle = EXCLUDED.bundle;

-- 4. PERFORMANCE INDEXES
-- Critical for the new Student Identity login method (First+Last+Phone)
CREATE INDEX IF NOT EXISTS idx_submissions_identity_lookup ON submissions("firstName", "lastName", "phone");
CREATE INDEX IF NOT EXISTS idx_submissions_quiz_status ON submissions("quizId", "status");
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON quizzes("teacherId");

-- 5. SECURITY POLICIES (Supabase RLS)
ALTER TABLE app_translations ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Translations are publicly readable') THEN
        CREATE POLICY "Translations are publicly readable" ON app_translations FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Ensure public can insert submissions (for quiz taking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write access for submissions') THEN
        CREATE POLICY "Public write access for submissions" ON submissions FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;
`;
};
