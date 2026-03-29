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

const SuggestedConnections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggested-connections', user?.id],
    queryFn: async () => {
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

      const connectedIds = new Set<string>();
      connectedIds.add(user!.id);
      connections?.forEach((c: any) => {
        connectedIds.add(c.requester_id);
        connectedIds.add(c.receiver_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'in', `(${Array.from(connectedIds).join(',')})`)
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
        <div className="space-y-6">
          {suggestions.map((p: any) => (
            <div key={p.id} className="flex flex-col items-center text-center">
              <Link to={`/profile/${p.user_id}`}>
                <Avatar className="h-16 w-16 border-3 border-primary/30">
                  <AvatarImage src={p.avatar_url || ''} />
                  <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                    {p.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link to={`/profile/${p.user_id}`} className="mt-2 text-sm font-semibold hover:underline">
                {p.full_name || 'User'}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{p.headline || 'Professional'}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs rounded-full gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-4"
                onClick={() => connect.mutate(p.user_id)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Connect
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedConnections;
