-- 4단계: 현재 앱의 user_notes만 변경합니다. 기존 vault_notes는 보존합니다.
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='user_notes' AND grantee IN ('anon','authenticated')
ORDER BY grantee, privilege_type;
SELECT role_name,
 has_table_privilege(role_name,'public.user_notes','SELECT') AS can_select,
 has_table_privilege(role_name,'public.user_notes','INSERT') AS can_insert,
 has_table_privilege(role_name,'public.user_notes','UPDATE') AS can_update,
 has_table_privilege(role_name,'public.user_notes','DELETE') AS can_delete
FROM (VALUES ('anon'),('authenticated')) AS roles(role_name);
BEGIN;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notes TO authenticated;
-- 서버 API는 service_role을 사용하므로 서버의 소유자 검사도 반드시 유지합니다.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notes TO service_role;
DROP POLICY IF EXISTS vault_owner_guard ON public.user_notes;
DROP POLICY IF EXISTS vault_owner_select ON public.user_notes;
DROP POLICY IF EXISTS vault_owner_insert ON public.user_notes;
DROP POLICY IF EXISTS vault_owner_update ON public.user_notes;
DROP POLICY IF EXISTS vault_owner_delete ON public.user_notes;
CREATE POLICY vault_owner_guard ON public.user_notes AS RESTRICTIVE FOR ALL TO authenticated
 USING ((select auth.uid())=owner_id) WITH CHECK ((select auth.uid())=owner_id);
CREATE POLICY vault_owner_select ON public.user_notes FOR SELECT TO authenticated
 USING ((select auth.uid())=owner_id);
CREATE POLICY vault_owner_insert ON public.user_notes FOR INSERT TO authenticated
 WITH CHECK ((select auth.uid())=owner_id);
CREATE POLICY vault_owner_update ON public.user_notes FOR UPDATE TO authenticated
 USING ((select auth.uid())=owner_id) WITH CHECK ((select auth.uid())=owner_id);
CREATE POLICY vault_owner_delete ON public.user_notes FOR DELETE TO authenticated
 USING ((select auth.uid())=owner_id);
COMMIT;
SELECT role_name,
 has_table_privilege(role_name,'public.user_notes','SELECT') AS can_select,
 has_table_privilege(role_name,'public.user_notes','INSERT') AS can_insert,
 has_table_privilege(role_name,'public.user_notes','UPDATE') AS can_update,
 has_table_privilege(role_name,'public.user_notes','DELETE') AS can_delete
FROM (VALUES ('anon'),('authenticated')) AS roles(role_name);
