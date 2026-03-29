import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdChoices = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ad Choices</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
            <p><strong>Last updated:</strong> March 29, 2026</p>
            <p>Network-Bloom may display ads to support the platform. We respect your choices regarding advertising.</p>

            <h3 className="text-foreground font-semibold text-base">How We Use Ads</h3>
            <p>Ads displayed on Network-Bloom are based on general content relevance and are not targeted using personal data unless you opt in.</p>

            <h3 className="text-foreground font-semibold text-base">Your Choices</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You can opt out of personalized advertising in your account settings</li>
              <li>You can report inappropriate ads using the report button</li>
              <li>Browser-level ad blockers are respected</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Contact</h3>
            <p>For ad-related inquiries, email <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdChoices;
