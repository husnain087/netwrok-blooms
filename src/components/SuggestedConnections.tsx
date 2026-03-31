import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const MutualConnectionCount: React.FC<{ userId: string; currentUserId: string }> = ({ userId, currentUserId }) => {
  const { data: count = 0 } = useQuery({
    queryKey: ['mutual-connections', userId, currentUserId],
    queryFn: async () => {
      // Get connections of the suggested user
      const { data: theirConns } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

      // Get connections of the current user
      const { data: myConns } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      const theirIds = new Set(
        (theirConns || []).map((c: any) => c.requester_id === userId ? c.receiver_id : c.requester_id)
      );
      const myIds = new Set(
        (myConns || []).map((c: any) => c.requester_id === currentUserId ? c.receiver_id : c.requester_id)
      );

      let mutual = 0;
      theirIds.forEach(id => { if (myIds.has(id)) mutual++; });
      return mutual;
    },
    enabled: !!userId && !!currentUserId,
  });

  if (count === 0) return null;
  return <p className="text-xs text-primary/70 mt-0.5">{count} mutual connection{count !== 1 ? 's' : ''}</p>;
};
const SuggestedConnections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggested-connections', user?.id],
    queryFn: async () => {
      // Fetch ALL connections (any status) to exclude everyone already connected/pending
      const { data: allConns } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

      const excludeIds = new Set<string>([user!.id]);
      (allConns || []).forEach((c: any) => {
        excludeIds.add(c.requester_id);
        excludeIds.add(c.receiver_id);
      });

      const excludeArr = Array.from(excludeIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'in', `(${excludeArr.join(',')})`)
        .limit(5);

      return profiles || [];
    },
    enabled: !!user,
  });

  const connect = useMutation({
    mutationFn: async (receiverId: string) => {
      const { error } = await supabase.from('connections').insert({
        requester_id: user!.id,
        receiver_id: receiverId,
        status: 'pending',
      });
      if (error) throw error;
      await supabase.rpc('insert_unique_notification', {
        p_user_id: receiverId,
        p_actor_id: user!.id,
        p_type: 'connection_request',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-connections'] });
      toast.success('Connection request sent!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-bold text-lg mb-5">Suggested Connections</h3>
        <div className="space-y-5">
          {suggestions.map((p: any) => {
            const initials = p.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U';
            return (
              <div key={p.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <Link to={`/profile/${p.user_id}`}>
                    <Avatar className="h-14 w-14 border-[3px] border-primary/40">
                      <AvatarImage src={p.avatar_url || ''} />
                      <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${p.user_id}`} className="text-sm font-bold hover:underline leading-tight">
                      {p.full_name || 'User'}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.headline || 'Professional'}</p>
                    <MutualConnectionCount userId={p.user_id} currentUserId={user!.id} />
                  </div>
                </div>
                <div className="flex justify-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-full gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-5"
                    onClick={() => connect.mutate(p.user_id)}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Connect
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedConnections;
