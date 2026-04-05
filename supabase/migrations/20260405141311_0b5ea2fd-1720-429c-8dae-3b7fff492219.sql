
-- Create stories table
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Everyone can view stories
CREATE POLICY "Stories viewable by everyone" ON public.stories FOR SELECT TO public USING (true);

-- Users can create own stories
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Users can delete own stories
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE TO public USING (auth.uid() = user_id);

-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

-- Storage policies for stories bucket
CREATE POLICY "Anyone can view stories" ON storage.objects FOR SELECT TO public USING (bucket_id = 'stories');
CREATE POLICY "Authenticated users can upload stories" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');
CREATE POLICY "Users can delete own stories" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);
