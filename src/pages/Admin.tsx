import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, FileText, Briefcase, Trash2, Ban, Search, BarChart3, MessageCircle, TrendingUp, Activity, UserCheck, UserX, Send, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [banDialog, setBanDialog] = useState<{ userId: string; name: string } | null>(null);
  const [messageDialog, setMessageDialog] = useState<{ userId: string; name: string } | null>(null);
  const [adminMsg, setAdminMsg] = useState('');

  // Check if current user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' });
      return data;
    },
    enabled: !!user,
  });

  // All profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // All posts
  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // All jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const { data } = await (supabase.from('jobs') as any).select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [{ count: userCount }, { count: postCount }, { count: jobCount }, { count: connCount }, { count: msgCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        (supabase.from('jobs') as any).select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);
      return { users: userCount || 0, posts: postCount || 0, jobs: jobCount || 0, connections: connCount || 0, messages: msgCount || 0 };
    },
    enabled: !!isAdmin,
  });

  // Insights - recent activity
  const { data: insights } = useQuery({
    queryKey: ['admin-insights'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [
        { count: newUsersWeek },
        { count: newUsersMonth },
        { count: newPostsWeek },
        { count: newPostsMonth },
        { count: newJobsWeek },
        { count: bannedCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        (supabase.from('jobs') as any).select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned' as any, true),
      ]);
      return {
        newUsersWeek: newUsersWeek || 0,
        newUsersMonth: newUsersMonth || 0,
        newPostsWeek: newPostsWeek || 0,
        newPostsMonth: newPostsMonth || 0,
        newJobsWeek: newJobsWeek || 0,
        bannedUsers: bannedCount || 0,
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
      toast.success('Job deleted');
    },
  });

  // Delete user (all content)
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('posts').delete().eq('user_id', userId);
      await supabase.from('comments').delete().eq('user_id', userId);
      await supabase.from('likes').delete().eq('user_id', userId);
      await supabase.from('connections').delete().or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`) as any;
      await supabase.from('notifications').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirmDelete(null);
      toast.success('User and all content deleted');
    },
  });

  // Ban user (temp)
  const banUser = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('profiles').update({ is_banned: true } as any).eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-insights'] });
      setBanDialog(null);
      toast.success('User temporarily banned');
    },
  });

  // Unban user
  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('profiles').update({ is_banned: false } as any).eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-insights'] });
      toast.success('User unbanned');
    },
  });

  // Send admin message to user
  const sendAdminMessage = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      await supabase.from('profiles').update({ admin_message: message } as any).eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setMessageDialog(null);
      setAdminMsg('');
      toast.success('Admin message sent to user');
    },
  });

  if (checkingAdmin) return <div className="text-center py-8 text-muted-foreground animate-pulse">Checking access...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredProfiles = profiles.filter((p: any) =>
    !searchQuery || p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.headline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in px-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, content & platform insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-primary' },
          { label: 'Total Posts', value: stats?.posts || 0, icon: FileText, color: 'text-green-500' },
          { label: 'Total Jobs', value: stats?.jobs || 0, icon: Briefcase, color: 'text-orange-500' },
          { label: 'Connections', value: stats?.connections || 0, icon: UserCheck, color: 'text-blue-500' },
          { label: 'Messages', value: stats?.messages || 0, icon: MessageCircle, color: 'text-purple-500' },
        ].map(stat => (
          <Card key={stat.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-extrabold">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Platform Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'New Users (7d)', value: insights?.newUsersWeek || 0, icon: UserCheck, color: 'text-green-500' },
              { label: 'New Users (30d)', value: insights?.newUsersMonth || 0, icon: Users, color: 'text-primary' },
              { label: 'New Posts (7d)', value: insights?.newPostsWeek || 0, icon: FileText, color: 'text-blue-500' },
              { label: 'New Posts (30d)', value: insights?.newPostsMonth || 0, icon: Activity, color: 'text-indigo-500' },
              { label: 'New Jobs (7d)', value: insights?.newJobsWeek || 0, icon: Briefcase, color: 'text-orange-500' },
              { label: 'Banned Users', value: insights?.bannedUsers || 0, icon: UserX, color: 'text-destructive' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center p-3 rounded-xl bg-muted/50 gap-1">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-xl font-extrabold">{item.value}</span>
                <span className="text-[10px] text-muted-foreground text-center font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="font-bold">Users</TabsTrigger>
          <TabsTrigger value="posts" className="font-bold">Posts</TabsTrigger>
          <TabsTrigger value="jobs" className="font-bold">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users by name or headline..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 font-medium" />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">User</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Headline</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Status</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Joined</TableHead>
                  <TableHead className="font-bold">Actions</TableHead>
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
                          <span className="font-bold text-sm">{p.full_name || 'No name'}</span>
                          {p.is_banned && <Badge variant="destructive" className="ml-2 text-[10px]">Banned</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.headline || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.is_banned ? (
                        <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {p.user_id !== user?.id && (
                        <div className="flex gap-1">
                          {/* Send Message */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary"
                            title="Send admin message"
                            onClick={() => { setMessageDialog({ userId: p.user_id, name: p.full_name || 'User' }); setAdminMsg(''); }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {/* Ban/Unban */}
                          {p.is_banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-600"
                              title="Unban user"
                              onClick={() => unbanUser.mutate(p.user_id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-500 hover:text-orange-600"
                              title="Temporarily ban user"
                              onClick={() => setBanDialog({ userId: p.user_id, name: p.full_name || 'User' })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete user & all content"
                            onClick={() => setConfirmDelete(p.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Content</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Type</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Created</TableHead>
                  <TableHead className="font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs truncate text-sm font-medium">{p.content?.slice(0, 80)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="font-bold">{p.post_type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Company</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Location</TableHead>
                  <TableHead className="font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-sm font-bold">{j.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{j.company}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{j.location}</TableCell>
                    <TableCell>
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
      </Tabs>

      {/* Delete User Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete User
            </DialogTitle>
            <DialogDescription>This will permanently delete this user and ALL their content (posts, comments, messages, connections). This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteUser.mutate(confirmDelete)}>
              Yes, Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <Ban className="h-5 w-5" /> Temporarily Ban User
            </DialogTitle>
            <DialogDescription>Ban <strong>{banDialog?.name}</strong>? They will see a "Your account is temporarily banned" message when they log in.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => banDialog && banUser.mutate(banDialog.userId)}>
              Yes, Ban User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Admin Message Dialog */}
      <Dialog open={!!messageDialog} onOpenChange={() => setMessageDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Send Message to {messageDialog?.name}
            </DialogTitle>
            <DialogDescription>This message will be displayed on the user's screen as an admin notice.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your admin message..."
            value={adminMsg}
            onChange={e => setAdminMsg(e.target.value)}
            className="min-h-[100px] font-medium"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setMessageDialog(null)}>Cancel</Button>
            <Button onClick={() => messageDialog && adminMsg.trim() && sendAdminMessage.mutate({ userId: messageDialog.userId, message: adminMsg.trim() })} disabled={!adminMsg.trim()}>
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
