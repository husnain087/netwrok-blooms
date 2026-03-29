import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Advertising = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Advertising on Network-Bloom</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
            <p>Promote your business, product, or service to a growing network of professionals on Network-Bloom.</p>

            <h3 className="text-foreground font-semibold text-base">Why Advertise With Us?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reach a professional, engaged audience</li>
              <li>Targeted advertising by industry and location</li>
              <li>Flexible budgets and campaign management</li>
              <li>Detailed analytics and performance reports</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Get Started</h3>
            <p>To start advertising, use the "Run Ads" feature from your feed or contact us at <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Advertising;
