
-- 1. Profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- 2. Profiles: prevent privilege escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_updates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'Not authorized to modify privileged profile fields';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS prevent_priv_profile_updates ON public.profiles;
CREATE TRIGGER prevent_priv_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_profile_updates();

-- 3. CV bucket: restrict to applicant or matching job poster
DROP POLICY IF EXISTS "Job posters can view CVs" ON storage.objects;
CREATE POLICY "CV access for applicant or job poster"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cvs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE j.user_id = auth.uid()
        AND ja.cv_url LIKE '%' || storage.objects.name
    )
  )
);

-- 4. Notifications: lock down INSERT to actor=auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users create notifications as themselves"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- 5. Promo codes: only admins can read
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;
-- Admins-only policy already exists ("Admins can manage promo codes" ALL)

-- 6. Storage: per-user folder ownership for INSERT/UPDATE
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated can upload covers" ON storage.objects;
CREATE POLICY "Users upload own covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own cover" ON storage.objects;
CREATE POLICY "Users update own covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated can upload post images" ON storage.objects;
CREATE POLICY "Users upload own post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
CREATE POLICY "Users upload own post videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated can upload job documents" ON storage.objects;
CREATE POLICY "Users upload own job documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload CVs" ON storage.objects;
CREATE POLICY "Users upload own CVs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
CREATE POLICY "Users upload own stories"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Drop redundant SELECT policies on public buckets (public URLs still work)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view job documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stories" ON storage.objects;

-- 8. Realtime: require authentication for channel subscriptions
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated realtime access" ON realtime.messages';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Authenticated realtime access" ON realtime.messages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. Revoke EXECUTE on SECURITY DEFINER functions from anon/public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.insert_unique_notification(uuid, uuid, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_emails() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_privileged_profile_updates() FROM PUBLIC, anon, authenticated;

-- get_user_emails: enforce admin-only inside function and re-grant
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT id, email::text FROM auth.users;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;
