BEGIN;
CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (length(body) <= 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notes TO service_role;
CREATE INDEX IF NOT EXISTS user_notes_owner_id_idx ON public.user_notes(owner_id);
COMMIT;
-- 기존 vault_notes의 가상 자료와 기존 작업은 보존합니다.
SELECT relrowsecurity AS rls_enabled,
  has_table_privilege('anon','public.user_notes','SELECT') AS anon_read,
  has_table_privilege('authenticated','public.user_notes','SELECT') AS authenticated_read
FROM pg_class WHERE oid='public.user_notes'::regclass;
