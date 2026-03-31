import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Ban, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MainLayout = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['my-profile-ban', user?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('profiles') as any).select('is_banned, admin_message').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const dismissMessage = useMutation({
    mutationFn: async () => {
      await supabase.from('profiles').update({ admin_message: null } as any).eq('user_id', user!.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-profile-ban'] }),
  });

  // Show banned screen
  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-extrabold text-destructive">Account Temporarily Banned</h1>
            <p className="text-muted-foreground">Your account has been temporarily suspended by an administrator. Please contact support for more information.</p>
            <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Admin message banner */}
      {profile?.admin_message && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-2">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">Message from Admin</p>
              <p className="text-sm text-foreground mt-1">{profile.admin_message}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => dismissMessage.mutate()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
