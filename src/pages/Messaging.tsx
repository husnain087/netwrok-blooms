import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Messaging = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is admin or bloom_member
  const { data: isPrivileged = false } = useQuery({
    queryKey: ['is-privileged', user?.id],
    queryFn: async () => {
      const [{ data: isAdmin }, { data: isBloom }] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' as any }),
        supabase.rpc('has_role', { _user_id: user!.id, _role: 'bloom_member' as any }),
      ]);
      return isAdmin || isBloom;
    },
    enabled: !!user,
  });

  // Get connected users
  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
      return data || [];
    },
    enabled: !!user,
  });

  // Get all profiles for privileged users
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-profiles-messaging'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id').neq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user && isPrivileged,
  });

  const connectedUserIds = isPrivileged
    ? allProfiles.map((p: any) => p.user_id)
    : connections.map((c: any) =>
        c.requester_id === user?.id ? c.receiver_id : c.requester_id
      );

  // Fetch last message timestamps for sorting
  const { data: lastMessageMap = {} } = useQuery({
    queryKey: ['last-msg-map', user?.id, connectedUserIds.join(',')],
    queryFn: async () => {
      if (connectedUserIds.length === 0) return {};
      const map: Record<string, { time: string; unread: number }> = {};
      // Fetch all messages involving current user to build the map
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, is_read')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });
      
      if (msgs) {
        for (const msg of msgs) {
          const otherId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
          if (!map[otherId]) {
            map[otherId] = { time: msg.created_at, unread: 0 };
          }
          if (msg.sender_id !== user!.id && msg.receiver_id === user!.id && !msg.is_read) {
            map[otherId].unread++;
          }
        }
      }
      return map;
    },
    enabled: !!user && connectedUserIds.length > 0,
    refetchInterval: 15000,
  });

  // Sort: unread first, then by latest message time
  const sortedUserIds = useMemo(() => {
    return [...connectedUserIds].sort((a: string, b: string) => {
      const aData = (lastMessageMap as any)[a];
      const bData = (lastMessageMap as any)[b];
      const aUnread = aData?.unread || 0;
      const bUnread = bData?.unread || 0;
      // Unread conversations first
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      // Then by latest message time
      const aTime = aData?.time ? new Date(aData.time).getTime() : 0;
      const bTime = bData?.time ? new Date(bData.time).getTime() : 0;
      return bTime - aTime;
    });
  }, [connectedUserIds, lastMessageMap]);

  // Fetch initial messages when user is selected
  useEffect(() => {
    if (!selectedUser || !user) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedUser)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-msg-from', selectedUser] });
      queryClient.invalidateQueries({ queryKey: ['last-msg-map'] });
    };
    fetchMessages();
  }, [selectedUser, user, queryClient]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedUser) ||
          (msg.sender_id === selectedUser && msg.receiver_id === user.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id === selectedUser) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
        queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] });
        queryClient.invalidateQueries({ queryKey: ['unread-msg-from'] });
        queryClient.invalidateQueries({ queryKey: ['last-msg-map'] });
        queryClient.invalidateQueries({ queryKey: ['last-msg'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !user) return;
    const content = messageText;
    setMessageText('');
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content,
    });
    await supabase.rpc('insert_unique_notification', {
      p_user_id: selectedUser,
      p_actor_id: user.id,
      p_type: 'message',
    });
  };

  const handleBack = () => setSelectedUser(null);

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4">
      <Card className="h-[calc(100vh-8rem)] flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r flex-col`}>
          <div className="p-3 border-b font-semibold text-lg">Messaging</div>
          <div className="flex-1 overflow-y-auto">
            {sortedUserIds.map((uid: string) => (
              <ConversationItem
                key={uid}
                userId={uid}
                isSelected={selectedUser === uid}
                onClick={() => setSelectedUser(uid)}
              />
            ))}
            {sortedUserIds.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Connect with people to start messaging.</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedUser ? (
            <>
              <ChatHeader userId={selectedUser} onBack={handleBack} />
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 text-sm transition-all ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}>
                      <p className="break-words">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-70">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-2 sm:p-3 border-t flex gap-2">
                <Input
                  placeholder="Write a message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="text-base"
                />
                <Button size="icon" onClick={sendMessage} disabled={!messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const ConversationItem: React.FC<{ userId: string; isSelected: boolean; onClick: () => void }> = ({ userId, isSelected, onClick }) => {
  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      return data;
    },
  });

  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-msg-from', userId, user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: lastMessage } = useQuery({
    queryKey: ['last-msg', userId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (!profile) return null;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition-colors ${isSelected ? 'bg-secondary' : ''}`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>{profile.full_name}</p>
          {lastMessage && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">
              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {lastMessage
              ? `${lastMessage.sender_id === user?.id ? 'You: ' : ''}${lastMessage.content.slice(0, 35)}${lastMessage.content.length > 35 ? '...' : ''}`
              : profile.headline || 'Start a conversation'
            }
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1 flex-shrink-0 ml-1">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const ChatHeader: React.FC<{ userId: string; onBack: () => void }> = ({ userId, onBack }) => {
  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      return data;
    },
  });

  return (
    <div className="p-3 border-b flex items-center gap-3">
      <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 flex-shrink-0" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Avatar className="h-9 w-9">
        <AvatarImage src={profile?.avatar_url || ''} />
        <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold">{profile?.full_name}</p>
        <p className="text-xs text-muted-foreground">{profile?.headline}</p>
      </div>
    </div>
  );
};

export default Messaging;
