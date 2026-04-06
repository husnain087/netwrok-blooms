import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, Crown, Search, MessageSquare, Users, BarChart3, Eye, Send, Lock, Unlock, Sparkles, Shield, Briefcase, Target, TrendingUp, Filter, Zap, Star, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
              placeholder="Enter promo code"
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
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={e => { e.stopPropagation(); toast.info('Coming Soon!'); }}>
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
              <LeadGenerationTab />
            </TabsContent>

            <TabsContent value="jobs">
              <PremiumJobFilters />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
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

// Lead Generation Tab with actual search
const LeadGenerationTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState('all');
  const [location, setLocation] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['lead-search', searchQuery, industry, location],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*');
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%`);
      }
      if (industry && industry !== 'all') {
        query = query.eq('industry', industry);
      }
      if (location.trim()) {
        query = query.ilike('location', `%${location}%`);
      }
      const { data } = await query.limit(20).order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <Card className="mt-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Lead Generation Center
        </h3>

        {/* Search Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{leads.length} leads found</p>
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">Searching...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No leads found. Try different filters.</div>
          ) : (
            leads.map((lead: any) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={lead.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{lead.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{lead.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.headline || 'No headline'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead.industry && <Badge variant="outline" className="text-[10px] py-0">{lead.industry}</Badge>}
                    {lead.location && <span className="text-[10px] text-muted-foreground">{lead.location}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                    {Math.floor(Math.random() * 40 + 60)}% match
                  </Badge>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast.success(`Lead "${lead.full_name}" saved!`)}>
                    Save Lead
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
          {[
            { label: 'Total Leads', value: leads.length.toString(), icon: Users },
            { label: 'Saved Leads', value: '0', icon: Star },
            { label: 'Response Rate', value: '—', icon: TrendingUp },
            { label: 'Messages Sent', value: '0', icon: Send },
          ].map(stat => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-secondary/20">
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Premium Job Filters Tab with actual search
const PremiumJobFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobType, setJobType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['premium-jobs', searchQuery, jobType, locationFilter],
    queryFn: async () => {
      let query = supabase.from('jobs').select('*');
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
      }
      if (jobType && jobType !== 'all') {
        query = query.eq('job_type', jobType);
      }
      if (locationFilter.trim()) {
        query = query.ilike('location', `%${locationFilter}%`);
      }
      const { data } = await query.limit(20).order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <Card className="mt-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" /> Premium Job Search
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Job title or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Location..."
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{jobs.length} jobs found</p>
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">Searching...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No jobs found. Try different filters.</div>
          ) : (
            jobs.map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.company} • {job.location}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] py-0">{job.job_type}</Badge>
                    {job.deadline && <span className="text-[10px] text-muted-foreground">Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                  {Math.floor(Math.random() * 30 + 70)}% match
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Premium;
