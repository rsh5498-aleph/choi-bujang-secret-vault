-- DB 정책 점검용 가상 ID만 사용하고 모든 변경은 ROLLBACK합니다.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
INSERT INTO public.user_notes(id,owner_id,title,body) VALUES
('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','RLS fixture','Rollback test');
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.user_notes WHERE id='44444444-4444-4444-8444-444444444444';
 IF n<>1 THEN RAISE EXCEPTION 'Own SELECT failed'; END IF;
 UPDATE public.user_notes SET title='RLS updated' WHERE id='44444444-4444-4444-8444-444444444444';
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'Own UPDATE failed'; END IF;
 BEGIN
  UPDATE public.user_notes SET owner_id='22222222-2222-4222-8222-222222222222' WHERE id='44444444-4444-4444-8444-444444444444';
  RAISE EXCEPTION 'Owner transfer was allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.user_notes WHERE id='44444444-4444-4444-8444-444444444444';
 IF n<>0 THEN RAISE EXCEPTION 'Cross-owner SELECT allowed'; END IF;
 UPDATE public.user_notes SET title='Unauthorized' WHERE id='44444444-4444-4444-8444-444444444444';
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'Cross-owner UPDATE allowed'; END IF;
 DELETE FROM public.user_notes WHERE id='44444444-4444-4444-8444-444444444444';
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'Cross-owner DELETE allowed'; END IF;
 BEGIN
  INSERT INTO public.user_notes(owner_id,title,body) VALUES('11111111-1111-4111-8111-111111111111','Unauthorized','Blocked');
  RAISE EXCEPTION 'Cross-owner INSERT allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO public.user_notes(id,owner_id,title,body) VALUES('55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222','B fixture','Rollback');
 DELETE FROM public.user_notes WHERE id='55555555-5555-4555-8555-555555555555';
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'Own DELETE failed'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: own CRUD; cross-owner denial; owner transfer denial; rolled back' AS rls_simulation;
