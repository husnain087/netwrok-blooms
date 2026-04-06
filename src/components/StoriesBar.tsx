import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
}

interface StoryGroup {
  user_id: string;
  profile: any;
  stories: Story[];
}

const StoriesBar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

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

  const connectedIds = React.useMemo(() => {
    const ids = connections.map((c: any) =>
      c.requester_id === user?.id ? c.receiver_id : c.requester_id
    );
    if (user) ids.push(user.id);
    return ids;
  }, [connections, user?.id]);

  const { data: stories = [] } = useQuery({
    queryKey: ['stories', connectedIds],
    queryFn: async () => {
      if (connectedIds.length === 0) return [];
      const { data } = await supabase
        .from('stories')
        .select('*')
        .in('user_id', connectedIds)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      return (data || []) as Story[];
    },
    enabled: connectedIds.length > 0,
    refetchInterval: 60000,
  });

  const storyUserIds = React.useMemo(() => [...new Set(stories.map(s => s.user_id))], [stories]);

  const { data: profiles = [] } = useQuery({
    queryKey: ['story-profiles', storyUserIds],
    queryFn: async () => {
      if (storyUserIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('*').in('user_id', storyUserIds);
      return data || [];
    },
    enabled: storyUserIds.length > 0,
  });

  const storyGroups = React.useMemo((): StoryGroup[] => {
    const groups: StoryGroup[] = [];
    const userMap = new Map<string, Story[]>();
    stories.forEach(s => {
      if (!userMap.has(s.user_id)) userMap.set(s.user_id, []);
      userMap.get(s.user_id)!.push(s);
    });

    if (user && userMap.has(user.id)) {
      const profile = profiles.find(p => p.user_id === user.id);
      groups.push({ user_id: user.id, profile, stories: userMap.get(user.id)! });
    }

    userMap.forEach((userStories, userId) => {
      if (userId === user?.id) return;
      const profile = profiles.find(p => p.user_id === userId);
      groups.push({ user_id: userId, profile, stories: userStories });
    });

    return groups;
  }, [stories, profiles, user?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile('stories', user.id, file);
      await supabase.from('stories').insert({ user_id: user.id, image_url: url });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story uploaded!');
    } catch (err) {
      toast.error('Failed to upload story');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!user) return;
    try {
      await supabase.from('stories').delete().eq('id', storyId).eq('user_id', user.id);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted');
      // If this was the last story in the group, close viewer
      if (viewingGroup) {
        const remaining = viewingGroup.stories.filter(s => s.id !== storyId);
        if (remaining.length === 0) {
          setViewingGroup(null);
        } else {
          setViewingGroup({ ...viewingGroup, stories: remaining });
          setCurrentIndex(Math.min(currentIndex, remaining.length - 1));
        }
      }
    } catch {
      toast.error('Failed to delete story');
    }
  };

  const openViewer = (group: StoryGroup) => {
    setViewingGroup(group);
    setCurrentIndex(0);
  };

  const nextStory = () => {
    if (!viewingGroup) return;
    if (currentIndex < viewingGroup.stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      const idx = storyGroups.findIndex(g => g.user_id === viewingGroup.user_id);
      if (idx < storyGroups.length - 1) {
        setViewingGroup(storyGroups[idx + 1]);
        setCurrentIndex(0);
      } else {
        setViewingGroup(null);
      }
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  return (
    <>
      <div className="bg-card border rounded-2xl p-3 shadow-sm">
        <ScrollArea className="w-full">
          <div className="flex gap-3 items-center pb-1">
            <div className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0" onClick={() => fileRef.current?.click()}>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-6 w-6 text-primary" />
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Your Story</span>
            </div>

            {storyGroups.map(group => (
              <div
                key={group.user_id}
                className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
                onClick={() => openViewer(group)}
              >
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-primary/60">
                  <Avatar className="h-13 w-13 border-2 border-card">
                    <AvatarImage src={group.profile?.avatar_url || ''} />
                    <AvatarFallback className="text-xs font-bold">
                      {group.profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-14 text-center">
                  {group.user_id === user?.id ? 'You' : group.profile?.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={!!viewingGroup} onOpenChange={(open) => !open && setViewingGroup(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none rounded-2xl">
          {viewingGroup && viewingGroup.stories[currentIndex] && (
            <div className="relative w-full aspect-[9/16] max-h-[80vh]">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {viewingGroup.stories.map((_, i) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${i <= currentIndex ? 'bg-white w-full' : 'w-0'}`} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 left-3 right-3 z-20 flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-white/50">
                  <AvatarImage src={viewingGroup.profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{viewingGroup.profile?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-semibold">
                  {viewingGroup.profile?.full_name || 'User'}
                </span>
                <span className="text-white/60 text-xs">
                  {new Date(viewingGroup.stories[currentIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {/* Delete button - only for own stories */}
                  {viewingGroup.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={() => handleDeleteStory(viewingGroup.stories[currentIndex].id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => setViewingGroup(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <img
                src={viewingGroup.stories[currentIndex].image_url}
                alt="Story"
                className="w-full h-full object-contain bg-black"
              />

              <div className="absolute inset-0 z-10 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
                <div className="w-1/3 h-full" />
                <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoriesBar;
