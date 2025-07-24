'use client';

import { useState } from 'react';
import ChallengeList from '@/components/challenge-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ChallengesDashboardPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generatedChallenge, setGeneratedChallenge] = useState<any>(null); // Or a more specific type
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateChallenge = async () => {
    if (!resumeText || !jobDescription) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both resume text and job description.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedChallenge(null); // Clear previous result

    try {
      // **TODO: Call your backend API to trigger the AI flow**
      // Replace this with your actual API call to the endpoint that uses generateCustomChallengePrompt
      console.log('Generating challenge with:', { resumeText, jobDescription });
      
      // Placeholder for API call result
      const result = {
        success: true,
        challenge: {
          title: 'Generated Tech Challenge',
          description: 'This is a generated challenge based on the provided resume and job description.',
          skills: ['React', 'Node.js', 'TypeScript'],
          setup: 'Clone the starter repo and follow the instructions.',
          // Add other relevant fields from your AI flow output
        },
      };

      if (result.success) {
        setGeneratedChallenge(result.challenge);
        toast({
          title: 'Challenge Generated',
          description: 'A new tech challenge has been successfully generated.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Could not generate the challenge. Please try again.', // Use result.error if your API provides it
        });
      }
    } catch (error: any) {
      console.error('Error generating challenge:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Error',
        description: error.message || 'An unexpected error occurred during generation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">
            Challenges Dashboard
        </h1>

        {/* Generate Challenge Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Tailored Challenge</CardTitle>
            <CardDescription>Provide a resume and job description to generate a custom tech challenge.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="resume">Resume Text</Label>
                <Textarea
                  id="resume"
                  placeholder="Paste resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={10}
                />
              </div>
              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                />
              </div>
              <Button
                onClick={handleGenerateChallenge}
                disabled={isLoading || !resumeText || !jobDescription}
              >
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Challenge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display Generated Challenge */}
        {generatedChallenge && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{generatedChallenge.title}</CardTitle>
              {/* Add other challenge details here if available */}
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{generatedChallenge.description}</p>
              {/* Display other generated challenge details like skills, setup, etc. */}
               {generatedChallenge.skills && (
                   <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {generatedChallenge.skills.map((skill: string, index: number) => (
                                <Badge key={index}>{skill}</Badge>
                            ))}
                        </div>
                   </div>
               )}
                {generatedChallenge.setup && (
                   <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
                        <p className="text-muted-foreground">{generatedChallenge.setup}</p>
                   </div>
               )}
            </CardContent>
          </Card>
        )}

        {/* Existing Challenge List */}
        <ChallengeList />
    </div>
  );
}
