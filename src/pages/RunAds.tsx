import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Rocket, BarChart3, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RunAds = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-lg w-full text-center overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 pb-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/15 mb-4">
            <Megaphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Run Ads</h1>
          <p className="text-lg text-muted-foreground font-semibold">Coming Soon</p>
        </div>
        <CardContent className="p-8 space-y-6">
          <p className="text-base text-muted-foreground leading-relaxed">
            We're building a powerful advertising platform to help you reach the right audience. Stay tuned for updates!
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Targeting</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Analytics</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Campaigns</span>
            </div>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" className="rounded-full px-8 font-bold">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunAds;
