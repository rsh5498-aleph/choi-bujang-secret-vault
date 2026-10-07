-- 실제 계정 생성 후 SQL Editor에서 아래 두 이메일 자리표시자만 교체합니다.
-- 이메일·비밀번호를 GitHub에 기록하지 않습니다. 원본 vault_notes는 보존합니다.
BEGIN;
DO $$
DECLARE a uuid; b uuid; originals integer;
BEGIN
 SELECT id INTO a FROM auth.users WHERE lower(email)=lower('REPLACE_WITH_A_EMAIL');
 SELECT id INTO b FROM auth.users WHERE lower(email)=lower('REPLACE_WITH_B_EMAIL');
 IF a IS NULL OR b IS NULL OR a=b THEN RAISE EXCEPTION '서로 다른 A/B Auth 계정 두 개가 필요합니다'; END IF;
 SELECT count(*) INTO originals FROM public.vault_notes;
 IF originals<>4 THEN RAISE EXCEPTION '원본 메모가 4건인지 먼저 확인하세요'; END IF;
 INSERT INTO public.user_notes(id,owner_id,title,body)
 SELECT ('66666666-6666-4666-8666-'||lpad(rank::text,12,'0'))::uuid,
        CASE WHEN rank<=3 THEN a ELSE b END,title,content
 FROM (SELECT title,content,row_number() OVER(ORDER BY display_order,id) AS rank FROM public.vault_notes) AS original
 ON CONFLICT(id) DO NOTHING;
 IF (SELECT count(*) FROM public.user_notes WHERE id IN('66666666-6666-4666-8666-000000000001','66666666-6666-4666-8666-000000000002','66666666-6666-4666-8666-000000000003') AND owner_id=a)<>3
 OR (SELECT count(*) FROM public.user_notes WHERE id='66666666-6666-4666-8666-000000000004' AND owner_id=b)<>1
 THEN RAISE EXCEPTION '기존 ID 충돌 또는 소유자 연결 확인 실패'; END IF;
END $$;
COMMIT;
SELECT owner_id,count(*) AS note_count FROM public.user_notes
WHERE id IN('66666666-6666-4666-8666-000000000001','66666666-6666-4666-8666-000000000002','66666666-6666-4666-8666-000000000003','66666666-6666-4666-8666-000000000004')
GROUP BY owner_id;
