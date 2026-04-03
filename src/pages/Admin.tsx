import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Shield, Users, FileText, Briefcase, Trash2, Ban, Search, MessageCircle, UserX, PauseCircle, PlayCircle, AlertTriangle, Activity, TrendingUp, BadgeCheck, Mail, CheckCircle, XCircle, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Navigate } from 'react-router-dom';

type UserAction = { type: 'ban' | 'suspend' | 'delete'; userId: string; userName: string } | null;
type MessageTarget = { userId: string; userName: string } | null;

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [userAction, setUserAction] = useState<UserAction>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [messageTarget, setMessageTarget] = useState<MessageTarget>(null);
  const [directMessage, setDirectMessage] = useState('');

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' });
      return data;
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const { data } = await (supabase.from('jobs') as any).select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const { data: verificationRequests = [] } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const { data } = await (supabase.from('verification_requests') as any).select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [{ count: userCount }, { count: postCount }, { count: jobCount }, { count: connCount }, { count: msgCount }, { count: bannedCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        (supabase.from('jobs') as any).select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      ]);
      return {
        users: userCount || 0,
        posts: postCount || 0,
        jobs: jobCount || 0,
        connections: connCount || 0,
        messages: msgCount || 0,
        banned: bannedCount || 0,
      };
    },
    enabled: !!isAdmin,
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('likes').delete().eq('post_id', postId);
      await supabase.from('posts').delete().eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Post deleted');
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      await (supabase.from('jobs') as any).delete().eq('id', jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Job deleted');
    },
  });

  const handleUserAction = async () => {
    if (!userAction) return;
    const { type, userId } = userAction;

    try {
      if (type === 'ban') {
        await supabase.from('profiles').update({
          is_banned: true,
          admin_message: adminMessage || 'Your account has been banned by an administrator.',
        }).eq('user_id', userId);
        toast.success('User banned successfully');
      } else if (type === 'suspend') {
        await supabase.from('profiles').update({
          is_banned: true,
          admin_message: adminMessage || 'Your account has been temporarily suspended.',
        }).eq('user_id', userId);
        toast.success('User suspended successfully');
      } else if (type === 'delete') {
        // Delete all user content
        await supabase.from('posts').delete().eq('user_id', userId);
        await supabase.from('comments').delete().eq('user_id', userId);
        await supabase.from('likes').delete().eq('user_id', userId);
        await supabase.from('connections').delete().or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
        await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        await supabase.from('notifications').delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`);
        await supabase.from('profiles').delete().eq('user_id', userId);
        toast.success('User account and all data deleted');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setUserAction(null);
      setAdminMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const unbanUser = async (userId: string) => {
    await supabase.from('profiles').update({ is_banned: false, admin_message: null }).eq('user_id', userId);
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    toast.success('User unbanned');
  };

  const handleVerification = async (requestId: string, userId: string, approved: boolean) => {
    try {
      await (supabase.from('verification_requests') as any)
        .update({ status: approved ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq('id', requestId);
      await supabase.from('profiles').update({ is_verified: approved } as any).eq('user_id', userId);
      if (approved) {
        // Also add verified_user role
        await supabase.from('user_roles').insert({ user_id: userId, role: 'verified_user' as any });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success(approved ? 'User verified!' : 'Verification rejected');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      toast.success(`Role "${role}" assigned`);
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const sendDirectMessage = async () => {
    if (!messageTarget || !directMessage.trim() || !user) return;
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: messageTarget.userId,
        content: directMessage,
      });
      await supabase.rpc('insert_unique_notification', {
        p_user_id: messageTarget.userId,
        p_actor_id: user.id,
        p_type: 'message',
      });
      toast.success(`Message sent to ${messageTarget.userName}`);
      setMessageTarget(null);
      setDirectMessage('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredProfiles = profiles.filter((p: any) =>
    !searchQuery || p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.headline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = profiles.filter((p: any) => !p.is_banned).length;
  const bannedUsers = profiles.filter((p: any) => p.is_banned).length;

  const actionLabels = {
    ban: { title: 'Ban User', desc: 'This will block the user from accessing the platform.', btnText: 'Ban User', icon: Ban },
    suspend: { title: 'Suspend User', desc: 'This will temporarily suspend the user account.', btnText: 'Suspend User', icon: PauseCircle },
    delete: { title: 'Delete Account', desc: 'This will permanently delete the user account and all their data. This action cannot be undone.', btnText: 'Delete Account', icon: Trash2 },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, content, and platform activity</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'bg-primary/10 text-primary' },
          { label: 'Active Users', value: activeUsers, icon: Activity, color: 'bg-green-500/10 text-green-600' },
          { label: 'Banned', value: bannedUsers, icon: Ban, color: 'bg-destructive/10 text-destructive' },
          { label: 'Total Posts', value: stats?.posts || 0, icon: FileText, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Total Jobs', value: stats?.jobs || 0, icon: Briefcase, color: 'bg-orange-500/10 text-orange-600' },
          { label: 'Messages', value: stats?.messages || 0, icon: MessageCircle, color: 'bg-purple-500/10 text-purple-600' },
        ].map(stat => (
          <Card key={stat.label} className="rounded-xl">
            <CardContent className="p-4 text-center space-y-2">
              <div className={`mx-auto h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="users" className="font-bold text-xs sm:text-sm">Users ({profiles.length})</TabsTrigger>
          <TabsTrigger value="posts" className="font-bold text-xs sm:text-sm">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="jobs" className="font-bold text-xs sm:text-sm">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="verify" className="font-bold text-xs sm:text-sm">Verify ({verificationRequests.filter((r: any) => r.status === 'pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users by name or headline..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          <Card className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Headline</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.avatar_url || ''} />
                          <AvatarFallback className="text-xs font-bold">{p.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{p.full_name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{p.headline?.slice(0, 30) || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{p.headline || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {p.is_banned ? (
                        <Badge variant="destructive" className="text-xs">Banned</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-0">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.user_id !== user?.id && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Send Message"
                            onClick={() => setMessageTarget({ userId: p.user_id, userName: p.full_name || 'this user' })}>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          {p.is_banned ? (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600 hover:text-green-700" onClick={() => unbanUser(p.user_id)}>
                              <PlayCircle className="h-4 w-4 mr-1" /> Unban
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600" title="Suspend"
                                onClick={() => setUserAction({ type: 'suspend', userId: p.user_id, userName: p.full_name || 'this user' })}>
                                <PauseCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Ban"
                                onClick={() => setUserAction({ type: 'ban', userId: p.user_id, userName: p.full_name || 'this user' })}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Assign Role">
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {['moderator', 'content_manager', 'support_agent', 'analyst', 'recruiter', 'bloom_member'].map(role => (
                                <DropdownMenuItem key={role} onClick={() => assignRole(p.user_id, role)}>
                                  Assign {role.replace(/_/g, ' ')}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete Account"
                            onClick={() => setUserAction({ type: 'delete', userId: p.user_id, userName: p.full_name || 'this user' })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProfiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs truncate text-sm font-medium">{p.content?.slice(0, 80)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary">{p.post_type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePost.mutate(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-sm font-bold">{j.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{j.company}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{j.location}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteJob.mutate(j.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card className="rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /> Verification Requests</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Work Email</TableHead>
                  <TableHead className="hidden md:table-cell">Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificationRequests.map((req: any) => {
                  const reqProfile = profiles.find((p: any) => p.user_id === req.user_id);
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reqProfile?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">{reqProfile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm">{reqProfile?.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.work_email}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {req.status === 'pending' && <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-0">Pending</Badge>}
                        {req.status === 'approved' && <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-0">Approved</Badge>}
                        {req.status === 'rejected' && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600 hover:text-green-700" onClick={() => handleVerification(req.id, req.user_id, true)}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => handleVerification(req.id, req.user_id, false)}>
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {verificationRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No verification requests</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Action Dialog */}
      <Dialog open={!!userAction} onOpenChange={() => { setUserAction(null); setAdminMessage(''); }}>
        <DialogContent className="sm:max-w-md rounded-xl">
          {userAction && (() => {
            const config = actionLabels[userAction.type];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <config.icon className="h-5 w-5 text-destructive" />
                    {config.title}
                  </DialogTitle>
                  <DialogDescription>
                    {config.desc}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-bold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      User: {userAction.userName}
                    </p>
                  </div>
                  {userAction.type !== 'delete' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message to user (optional)</label>
                      <Input
                        placeholder="Reason for this action..."
                        value={adminMessage}
                        onChange={e => setAdminMessage(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" className="rounded-xl" onClick={() => { setUserAction(null); setAdminMessage(''); }}>Cancel</Button>
                    <Button variant="destructive" className="rounded-xl" onClick={handleUserAction}>
                      {config.btnText}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Direct Message Dialog */}
      <Dialog open={!!messageTarget} onOpenChange={() => { setMessageTarget(null); setDirectMessage(''); }}>
        <DialogContent className="sm:max-w-md rounded-xl">
          {messageTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Send Message to {messageTarget.userName}
                </DialogTitle>
                <DialogDescription>
                  Send a direct message to this user's inbox.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  placeholder="Type your message..."
                  value={directMessage}
                  onChange={e => setDirectMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendDirectMessage()}
                  className="rounded-xl"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="rounded-xl" onClick={() => { setMessageTarget(null); setDirectMessage(''); }}>Cancel</Button>
                  <Button className="rounded-xl" onClick={sendDirectMessage} disabled={!directMessage.trim()}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
