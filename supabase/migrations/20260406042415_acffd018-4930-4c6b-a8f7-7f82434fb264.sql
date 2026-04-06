
CREATE TABLE public.community_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone,
  is_live boolean NOT NULL DEFAULT false,
  meeting_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.community_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view meetings" ON public.community_meetings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage meetings" ON public.community_meetings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
