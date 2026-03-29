import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Bookmark, Eye, BarChart3, TrendingUp } from 'lucide-react';

const ProfileSidebar = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: connectionCount = 0 } = useQuery({
    queryKey: ['connection-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: postCount = 0 } = useQuery({
    queryKey: ['post-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: totalLikes = 0 } = useQuery({
    queryKey: ['total-likes', user?.id],
    queryFn: async () => {
      // Get all user's post ids, then count likes on them
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user!.id);
      if (!userPosts || userPosts.length === 0) return 0;
      const postIds = userPosts.map(p => p.id);
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      return count || 0;
    },
    enabled: !!user,
  });

  if (!profile) return null;

  return (
    <div className="sticky top-20 space-y-4">
      <Card className="overflow-hidden">
        <div className="h-16 bg-primary" />
        <CardContent className="p-0">
          <div className="flex flex-col items-center -mt-8 px-4 pb-3">
            <Link to={`/profile/${user?.id}`}>
              <Avatar className="h-16 w-16 border-4 border-card">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-lg font-bold">
                  {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link to={`/profile/${user?.id}`} className="mt-2 font-semibold text-sm hover:underline text-center">
              {profile.full_name || 'Your Name'}
            </Link>
            <p className="text-xs text-muted-foreground text-center leading-tight mt-0.5">
              {profile.headline || 'Add a headline'}
            </p>
          </div>

          <div className="border-t px-4 py-2 space-y-1.5">
            <Link to={`/profile/${user?.id}`} className="flex items-center justify-between text-xs hover:bg-secondary p-1 rounded transition-colors">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Connections
              </span>
              <span className="font-semibold text-primary">{connectionCount}</span>
            </Link>
            <Link to={`/profile/${user?.id}`} className="flex items-center justify-between text-xs hover:bg-secondary p-1 rounded transition-colors">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Posts
              </span>
              <span className="font-semibold text-primary">{postCount}</span>
            </Link>
            <div className="flex items-center justify-between text-xs p-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Post likes
              </span>
              <span className="font-semibold text-primary">{totalLikes}</span>
            </div>
          </div>

          <div className="border-t px-4 py-2">
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full p-1 rounded hover:bg-secondary">
              <Bookmark className="h-3.5 w-3.5" />
              <span>My items</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Trending</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-primary">#WebDevelopment</p>
              <p className="text-xs text-muted-foreground">4K posts</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">#AI</p>
              <p className="text-xs text-muted-foreground">6K posts</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">#CareerGrowth</p>
              <p className="text-xs text-muted-foreground">1K posts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
