import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessServices = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Business Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
            <p>Network-Bloom offers a range of services to help businesses grow and manage their online presence.</p>

            <h3 className="text-foreground font-semibold text-base">Our Services</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Job Posting:</strong> Attract top talent with job listings</li>
              <li><strong>Advertising:</strong> Run targeted ad campaigns</li>
              <li><strong>Company Pages:</strong> Showcase your brand to professionals</li>
              <li><strong>Analytics:</strong> Track engagement and reach</li>
              <li><strong>Premium Plans:</strong> Unlock advanced features for teams</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Contact</h3>
            <p>For business inquiries, reach out at <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessServices;
