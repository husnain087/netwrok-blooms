-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  headline TEXT,
  summary TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  location TEXT,
  website TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Experience table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, company TEXT NOT NULL, location TEXT,
  start_date DATE, end_date DATE, description TEXT,
  is_current BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experiences viewable by everyone" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "Users can manage own experiences" ON public.experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiences" ON public.experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiences" ON public.experiences FOR DELETE USING (auth.uid() = user_id);

-- Education table
CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school TEXT NOT NULL, degree TEXT, field_of_study TEXT,
  start_date DATE, end_date DATE, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Education viewable by everyone" ON public.education FOR SELECT USING (true);
CREATE POLICY "Users can manage own education" ON public.education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON public.education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON public.education FOR DELETE USING (auth.uid() = user_id);

-- Skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON public.skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.skills FOR DELETE USING (auth.uid() = user_id);

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, image_url TEXT, video_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'article')),
  article_title TEXT, article_cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'celebrate', 'support', 'love', 'insightful', 'funny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id, post_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own likes" ON public.likes FOR UPDATE USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id), CHECK (requester_id != receiver_id)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send connection requests" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received requests" ON public.connections FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete own connections" ON public.connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'connection_request', 'connection_accepted', 'message', 'reaction', 'repost', 'job_application')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-videos', 'post-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('job-documents', 'job-documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Authenticated can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own cover" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view post images" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'post-videos');
CREATE POLICY "Users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view job documents" ON storage.objects FOR SELECT USING (bucket_id = 'job-documents');
CREATE POLICY "Authenticated can upload job documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can upload CVs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cvs' AND auth.uid() IS NOT NULL);
CREATE POLICY "Job posters can view CVs" ON storage.objects FOR SELECT USING (bucket_id = 'cvs' AND auth.uid() IS NOT NULL);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, title TEXT NOT NULL, company TEXT NOT NULL,
  location TEXT NOT NULL, job_type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL, skills TEXT[] DEFAULT '{}',
  deadline DATE, document_url TEXT, custom_fields JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Users can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL, answers JSONB DEFAULT '{}',
  cv_url TEXT, applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job posters can view applications" ON public.job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND user_id = auth.uid())
);
CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Reposts table
CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reposted_by UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reposts viewable by everyone" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = reposted_by);
CREATE POLICY "Users can unrepost" ON public.reposts FOR DELETE USING (auth.uid() = reposted_by);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL, UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Unique notification function
CREATE OR REPLACE FUNCTION public.insert_unique_notification(
  p_user_id UUID, p_actor_id UUID, p_type TEXT, p_post_id UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_post_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = p_user_id AND actor_id = p_actor_id AND type = p_type AND post_id = p_post_id) THEN RETURN; END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = p_user_id AND actor_id = p_actor_id AND type = p_type AND post_id IS NULL) THEN RETURN; END IF;
  END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, post_id) VALUES (p_user_id, p_actor_id, p_type, p_post_id);
END; $$;