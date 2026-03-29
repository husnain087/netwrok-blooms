import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Accessibility = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
            <p><strong>Last updated:</strong> March 29, 2026</p>
            <p>Network-Bloom is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards.</p>

            <h3 className="text-foreground font-semibold text-base">Our Commitment</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keyboard navigable interface</li>
              <li>Screen reader compatible content</li>
              <li>Sufficient color contrast ratios</li>
              <li>Resizable text without loss of functionality</li>
              <li>Alt text on all meaningful images</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Feedback</h3>
            <p>If you encounter any accessibility barriers, please contact us at <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Accessibility;
