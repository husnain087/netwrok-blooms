import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Help Center</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-sm text-muted-foreground">
            <p>Welcome to the Network-Bloom Help Center. Find answers to common questions or reach out to our support team.</p>

            <div className="grid gap-4 sm:grid-cols-2 not-prose">
              <Card className="p-4 space-y-2">
                <Mail className="h-6 w-6 text-primary" />
                <h4 className="font-bold text-foreground">Email Support</h4>
                <p className="text-sm text-muted-foreground">Reach us at</p>
                <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline font-semibold text-sm">networkbloom.work@gmail.com</a>
              </Card>
              <Card className="p-4 space-y-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h4 className="font-bold text-foreground">Live Chat</h4>
                <p className="text-sm text-muted-foreground">Use the chat widget at the bottom right of any page.</p>
              </Card>
            </div>

            <h3 className="text-foreground font-semibold text-base">Frequently Asked Questions</h3>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">How do I create an account?</h4>
                <p>Click "Sign Up" on the login page. You can register with your email or sign in with Google.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">How do I connect with other professionals?</h4>
                <p>Visit the Network tab and send connection requests. Once accepted, you can message each other directly.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">How do I post a job?</h4>
                <p>Go to the Jobs page and click "Post a Job". Fill in the details and publish.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">How do I delete my account?</h4>
                <p>Please email us at <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a> with your request.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Is Network-Bloom free?</h4>
                <p>Yes! Basic features are free. Premium features are available with a subscription.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
