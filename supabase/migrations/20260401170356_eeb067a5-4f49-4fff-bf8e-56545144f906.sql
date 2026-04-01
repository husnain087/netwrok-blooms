
-- Admin can update any profile (for ban/suspend)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any profile
CREATE POLICY "Admins can delete any profile"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any post
CREATE POLICY "Admins can delete any post"
ON public.posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any comment
CREATE POLICY "Admins can delete any comment"
ON public.comments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any like
CREATE POLICY "Admins can delete any like"
ON public.likes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any connection
CREATE POLICY "Admins can delete any connection"
ON public.connections FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any message
CREATE POLICY "Admins can delete any message"
ON public.messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any notification
CREATE POLICY "Admins can delete any notification"
ON public.notifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
