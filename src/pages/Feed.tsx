import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import ProfileSidebar from '@/components/ProfileSidebar';
import SuggestedConnections from '@/components/SuggestedConnections';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';

const Feed = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

  // Get user's connections for "Following" tab
  const { data: connections = [] } = useQuery({
    queryKey: ['connections-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
      return data || [];
    },
    enabled: !!user,
  });

  const connectedUserIds = React.useMemo(() => {
    return connections.map((c: any) =>
      c.requester_id === user?.id ? c.receiver_id : c.requester_id
    );
  }, [connections, user?.id]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: reposts = [] } = useQuery({
    queryKey: ['reposts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reposts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const feedItems = React.useMemo(() => {
    const items: { type: 'post' | 'repost'; data: any; sortDate: string }[] = [];

    const filteredPosts = activeTab === 'following'
      ? posts.filter(p => connectedUserIds.includes(p.user_id) || p.user_id === user?.id)
      : posts;

    filteredPosts.forEach(p => {
      items.push({ type: 'post', data: p, sortDate: p.created_at });
    });

    reposts.forEach((r: any) => {
      const originalPost = posts.find(p => p.id === r.post_id);
      if (originalPost) {
        if (activeTab === 'following' && !connectedUserIds.includes(r.reposted_by) && r.reposted_by !== user?.id) return;
        items.push({ type: 'repost', data: { ...originalPost, repost: r }, sortDate: r.created_at });
      }
    });

    items.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.type === 'repost' ? `repost-${item.data.repost.id}` : `post-${item.data.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [posts, reposts, activeTab, connectedUserIds, user?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Sidebar */}
      <aside className="lg:col-span-3 hidden lg:block">
        <ProfileSidebar />
      </aside>

      {/* Main Feed */}
      <div className="lg:col-span-6 space-y-4">
        <CreatePost />

        {/* Run Ads Button */}
        <Link to="/run-ads">
          <Button className="w-full rounded-2xl gap-2 font-bold text-base py-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Megaphone className="h-5 w-5" />
            Run Ads & Configure
          </Button>
        </Link>

        {/* For You / Following Tabs */}
        <div className="flex rounded-2xl bg-card border overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveTab('foryou')}
            className={`flex-1 py-3 text-base font-bold text-center transition-colors ${
              activeTab === 'foryou'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-base font-bold text-center transition-colors ${
              activeTab === 'following'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Following
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading feed...</div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {activeTab === 'following' ? 'No posts from your connections yet.' : 'No posts yet. Be the first to share!'}
          </div>
        ) : (
          feedItems.map((item) => (
            <PostCard
              key={item.type === 'repost' ? `repost-${item.data.repost.id}` : `post-${item.data.id}`}
              post={item.data}
              isRepost={item.type === 'repost'}
              repostedBy={item.type === 'repost' ? item.data.repost.reposted_by : undefined}
            />
          ))
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="lg:col-span-3 hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <SuggestedConnections />
        </div>
      </aside>
    </div>
  );
};

export default Feed;
