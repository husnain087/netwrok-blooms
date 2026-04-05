import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, Crown, Search, MessageSquare, Users, BarChart3, Eye, Send, Lock, Unlock, Sparkles, Shield, Briefcase, Target, TrendingUp, Filter, Zap, Star, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const plans = [
    { name: 'Career', price: '$29.99/mo', icon: Briefcase, color: 'text-blue-500', desc: 'Job seeker tools & insights' },
    { name: 'Business', price: '$59.99/mo', icon: TrendingUp, color: 'text-emerald-500', desc: 'Growth & lead generation' },
    { name: 'Sales Navigator', price: '$99.99/mo', icon: Target, color: 'text-orange-500', desc: 'Advanced prospecting suite' },
    { name: 'Recruiter Lite', price: '$139.99/mo', icon: Users, color: 'text-purple-500', desc: 'Hiring & talent search' },
  ];

  const premiumDashboardFeatures = [
    { icon: Filter, label: 'Advanced Job Filters', desc: 'Filter by salary, remote, experience level, company size' },
    { icon: Target, label: 'Lead Generation', desc: 'Find and track potential leads with AI scoring' },
    { icon: Search, label: 'Advanced People Search', desc: '20+ filters including industry, seniority, company' },
    { icon: MessageSquare, label: 'Unlimited InMail', desc: 'Message anyone on the platform directly' },
    { icon: Eye, label: 'Profile Viewers', desc: 'See everyone who viewed your profile in the last 90 days' },
    { icon: BarChart3, label: 'Sales Insights', desc: 'Track engagement, response rates & analytics' },
    { icon: Sparkles, label: 'AI Resume Builder', desc: 'AI-powered resume & cover letter suggestions' },
    { icon: Send, label: 'Smart Outreach', desc: 'Personalized message templates and tracking' },
    { icon: Globe, label: 'Open Profile', desc: 'Let anyone message you for free' },
    { icon: Star, label: 'Featured Applicant', desc: 'Your applications are highlighted to recruiters' },
    { icon: FileText, label: 'Salary Insights', desc: 'Detailed compensation data for any role' },
    { icon: Shield, label: 'Priority Support', desc: 'Get help faster with priority queue' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Active Status */}
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
                You have full access to all premium features including unrestricted messaging, lead generation, and advanced filters.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-primary" /> Redeem Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-1">
            Promo codes are exclusively for <span className="font-semibold text-primary">Bloom Selected Members</span> only.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            If you've received an invitation code, enter it below to unlock premium features instantly.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your promo code"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              className="flex-1"
            />
            <Button onClick={handleRedeem} disabled={redeeming || isPremium}>
              {redeeming ? 'Redeeming...' : isPremium ? 'Already Active' : 'Redeem'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans Section */}
      {!isPremium && (
        <div>
          <h2 className="text-xl font-bold mb-4">Choose a Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map(plan => (
              <Card key={plan.name} className="border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info('Coming Soon! This plan will be available shortly.')}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <plan.icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <Badge variant="outline" className="text-xs">{plan.price}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={e => { e.stopPropagation(); toast.info('Coming Soon! This plan will be available shortly.'); }}>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Premium Dashboard - shown when premium is active */}
      {isPremium ? (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Your Premium Tools
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Access all premium features below</p>

          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="tools">All Tools</TabsTrigger>
              <TabsTrigger value="leads">Lead Generation</TabsTrigger>
              <TabsTrigger value="jobs">Job Filters</TabsTrigger>
            </TabsList>

            <TabsContent value="tools">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {premiumDashboardFeatures.map(f => (
                  <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        {f.label}
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      </p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leads">
              <Card className="mt-4">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Lead Generation Center</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Search, label: 'Search Leads', desc: 'Find prospects by industry, role, location' },
                      { icon: Users, label: 'AI Lead Recommendations', desc: 'Smart suggestions based on your activity' },
                      { icon: BarChart3, label: 'Lead Scoring', desc: 'AI-powered engagement probability scores' },
                      { icon: Send, label: 'Outreach Templates', desc: 'Pre-built personalized message templates' },
                      { icon: Eye, label: 'Lead Tracking', desc: 'Track who opened your profile and messages' },
                      { icon: TrendingUp, label: 'Conversion Analytics', desc: 'Response rates, open rates, best times' },
                    ].map(f => (
                      <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <f.icon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{f.label}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs">
              <Card className="mt-4">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Filter className="h-5 w-5 text-primary" /> Premium Job Filters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: CreditCard, label: 'Salary Range Filter', desc: 'Filter jobs by exact salary brackets' },
                      { icon: Globe, label: 'Remote / Hybrid / Onsite', desc: 'Work arrangement preferences' },
                      { icon: Briefcase, label: 'Experience Level', desc: 'Entry, mid, senior, executive levels' },
                      { icon: Users, label: 'Company Size', desc: 'Startup, mid-market, enterprise' },
                      { icon: Star, label: 'Featured Applications', desc: 'Your applications get priority visibility' },
                      { icon: Sparkles, label: 'AI Job Match Score', desc: 'See how well you match each listing' },
                    ].map(f => (
                      <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <f.icon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{f.label}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Feature preview for non-premium users */
        <div>
          <h2 className="text-xl font-bold mb-4">What You'll Unlock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {premiumDashboardFeatures.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 opacity-70">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    {f.label}
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Premium;
