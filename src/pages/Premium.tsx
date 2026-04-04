import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, Crown, Search, MessageSquare, Users, BarChart3, Eye, Send, Lock, Unlock, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Premium = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['premium-subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPremium = !!subscription;
  const planType = subscription?.plan_type || '';

  const handleRedeem = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: promoCode.trim() });
      if (error) throw error;
      const result = data as any;
      if (result.success) {
        toast.success(result.message);
        setPromoCode('');
        queryClient.invalidateQueries({ queryKey: ['premium-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['is-privileged'] });
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to redeem promo code');
    } finally {
      setRedeeming(false);
    }
  };

  const salesNavFeatures = [
    { icon: Search, label: 'Advanced Lead Search', desc: 'Find ideal prospects with 20+ filters' },
    { icon: MessageSquare, label: 'Unlimited InMail', desc: 'Message anyone on the platform directly' },
    { icon: Users, label: 'Lead Recommendations', desc: 'AI-powered suggestions based on your preferences' },
    { icon: BarChart3, label: 'Sales Insights', desc: 'Track engagement and response analytics' },
    { icon: Eye, label: 'Profile Viewers', desc: 'See everyone who viewed your profile' },
    { icon: Send, label: 'Smart Outreach', desc: 'Personalized message templates and tracking' },
  ];

  const premiumFeatures = [
    { icon: Crown, label: 'Premium Badge', desc: 'Gold badge on your profile' },
    { icon: MessageSquare, label: 'Message Anyone', desc: 'Send messages without connection' },
    { icon: Eye, label: 'Profile Views', desc: 'See who viewed your profile' },
    { icon: Sparkles, label: 'AI Resume Builder', desc: 'AI-powered resume suggestions' },
    { icon: BarChart3, label: 'Salary Insights', desc: 'Detailed compensation data' },
    { icon: Shield, label: 'Priority Support', desc: 'Get help faster with priority queue' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Status */}
      {isPremium && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {planType === 'sales_navigator' ? 'Sales Navigator' : 'Premium'} Active
                <Badge className="bg-primary text-primary-foreground">Active</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                You have full access to all {planType === 'sales_navigator' ? 'Sales Navigator' : 'Premium'} features including unrestricted messaging.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Code Section */}
      {!isPremium && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-primary" /> Redeem Promo Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Have a promo code? Enter it below to unlock Premium or Sales Navigator features instantly.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code (e.g. areeba087)"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                className="flex-1"
              />
              <Button onClick={handleRedeem} disabled={redeeming}>
                {redeeming ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Sales Navigator Section */}
      <Card className={`border-2 ${planType === 'sales_navigator' ? 'border-primary' : 'border-border'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Sales Navigator
            {planType === 'sales_navigator' && <Badge className="bg-primary text-primary-foreground">Your Plan</Badge>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Advanced prospecting and lead management tools</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {salesNavFeatures.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    {f.label}
                    {isPremium ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Premium Section */}
      <Card className={`border-2 ${planType === 'premium' ? 'border-primary' : 'border-border'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> Premium
            {planType === 'premium' && <Badge className="bg-primary text-primary-foreground">Your Plan</Badge>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Unlock your full professional potential</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {premiumFeatures.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    {f.label}
                    {isPremium ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Premium;
