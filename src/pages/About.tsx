import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo.png';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader className="items-center text-center">
            <img src={logoImg} alt="Network-Bloom" className="h-16 w-16 rounded-full mx-auto mb-2" />
            <CardTitle className="text-2xl">About Network-Bloom</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>Network-Bloom</strong> is a professional networking platform designed to help individuals and businesses connect, grow, and thrive in today's digital world.
            </p>
            <p>
              Our mission is to empower professionals by providing tools for meaningful connections, career growth, knowledge sharing, and business opportunities — all in one place.
            </p>

            <h3 className="text-foreground font-semibold text-base">What We Offer</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Professional networking and connection building</li>
              <li>Job postings and career opportunities</li>
              <li>Content sharing and thought leadership</li>
              <li>AI-powered assistant for productivity</li>
              <li>Messaging and real-time communication</li>
              <li>Advertising and business promotion tools</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Our Values</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Trust & Privacy:</strong> Your data is safe with us</li>
              <li><strong>Inclusivity:</strong> A platform for everyone</li>
              <li><strong>Innovation:</strong> Constantly improving our tools</li>
              <li><strong>Community:</strong> Building meaningful professional relationships</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Contact Us</h3>
            <p>Email: <a href="mailto:networkbloom.work@gmail.com" className="text-primary underline">networkbloom.work@gmail.com</a></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
