
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  createCustomChallengeAction,
  createPromptedChallengeAction,
  createManualChallengeAction, // New action
} from "@/lib/actions";
import { CustomChallengeFormSchema, PromptChallengeFormSchema, ManualChallengeFormSchema } from "@/lib/schemas"; // New schema
import { Loader2, PlusCircle, MinusCircle } from "lucide-react";
import type { ChallengeResult, CustomChallengeResult, PromptedChallengeResult } from "@/types";
import { ChallengeResultDialog } from "./challenge-result-dialog";

// Define a type for touch points/flags
interface TouchPoint {
    id: string;
    description: string;
}

export function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([]);
  const [newTouchPointDescription, setNewTouchPointDescription] = useState('');
  const { toast } = useToast();

  const customForm = useForm<z.infer<typeof CustomChallengeFormSchema>>({
    resolver: zodResolver(CustomChallengeFormSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      jobTitle: "",
      resume: "", // This will now be handled via file upload
    },
  });

  const promptForm = useForm<z.infer<typeof PromptChallengeFormSchema>>({
    resolver: zodResolver(PromptChallengeFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Define schema and form for manual challenge
  const manualForm = useForm<z.infer<typeof ManualChallengeFormSchema>>({
      resolver: zodResolver(ManualChallengeFormSchema),
      defaultValues: {
          title: '',
          description: '',
          requirements: '',
          setupInstructions: '',
          // touchPoints: [] // Will be handled separately
      }
  })

  const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setResumeFile(file || null);
  };

  const handleAddTouchPoint = () => {
      if (newTouchPointDescription.trim() !== '') {
          setTouchPoints([...touchPoints, { id: Date.now().toString(), description: newTouchPointDescription }]);
          setNewTouchPointDescription('');
      }
  };

   const handleRemoveTouchPoint = (id: string) => {
      setTouchPoints(touchPoints.filter(tp => tp.id !== id));
  };


  async function onCustomSubmit(values: z.infer<typeof CustomChallengeFormSchema>) {
    setIsLoading(true);
    
    // **TODO: Handle resume file upload and pass necessary data to the action**
    console.log('Submitting custom challenge form with file:', resumeFile);
    
    // For now, we will use the text area value as a fallback or for testing without file upload backend
    const resumeContent = resumeFile ? '[Resume File Uploaded]' : values.resume; // Use a placeholder or actual extracted text if possible

    try {
      // Modify the action call to include resume file data or URL after upload
      const challengeResult = await createCustomChallengeAction({ 
          ...values,
           resume: resumeContent,
      });
      setResult(challengeResult);
      setIsResultOpen(true);
      setOpen(false);
      customForm.reset();
      setResumeFile(null); // Clear file input
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating challenge",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onPromptSubmit(values: z.infer<typeof PromptChallengeFormSchema>) {
    setIsLoading(true);
    try {
      const challengeResult = await createPromptedChallengeAction(values);
      setResult(challengeResult);
      setIsResultOpen(true);
      setOpen(false);
      promptForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating challenge",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onManualSubmit(values: z.infer<typeof ManualChallengeFormSchema>) {
      setIsLoading(true);
      // Include touch points in the submission data
      const challengeData = { ...values, touchPoints };
      console.log('Submitting manual challenge:', challengeData);
      
       try {
          // **TODO: Call the backend action to create manual challenge**
           const challengeResult = await createManualChallengeAction(challengeData); // Assuming this action exists
            setResult(challengeResult);
            setIsResultOpen(true);
            setOpen(false);
            manualForm.reset();
            setTouchPoints([]); // Clear touch points

       } catch (error) {
           toast({
              variant: "destructive",
              title: "Error creating manual challenge",
              description: "An unexpected error occurred. Please try again.",
           });
       } finally {
          setIsLoading(false);
       }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Challenge
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Generate a coding challenge using one of the methods below.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="custom">
            <TabsList className="grid w-full grid-cols-3"> {/* Increased grid columns */}
              <TabsTrigger value="custom">Custom from Resume</TabsTrigger>
              <TabsTrigger value="prompt">From Prompt</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger> {/* New tab */}
            </TabsList>
            <TabsContent value="custom">
              <Form {...customForm}>
                <form onSubmit={customForm.handleSubmit(onCustomSubmit)} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={customForm.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customForm.control}
                      name="candidateEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={customForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormItem>
                      <FormLabel>Candidate's Resume</FormLabel>
                      <FormControl>
                         <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} />
                      </FormControl>
                       {resumeFile && <p className="text-sm text-muted-foreground">Selected file: {resumeFile.name}</p>}
                      <FormMessage />
                  </FormItem>
                   <FormField
                    control={customForm.control}
                    name="resume"
                     render={({ field }) => (
                      <FormItem>
                        <FormLabel>Or Paste Resume Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste resume text here..." className="min-h-[150px]" {...field} disabled={!!resumeFile} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading || (!resumeFile && !customForm.getValues('resume'))}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Custom Challenge
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="prompt">
              <Form {...promptForm}>
                <form onSubmit={promptForm.handleSubmit(onPromptSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={promptForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Challenge Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., 'Create a simple API endpoint that fetches data from a public API and caches the result.'"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate from Prompt
                  </Button>
                </form>
              </Form>
            </TabsContent>
             <TabsContent value="manual"> {/* New Manual Challenge Tab */}
                 <Form {...manualForm}>
                    <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={manualForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Challenge Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Build a Todo App" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={manualForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Provide a brief description of the challenge." className="min-h-[100px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={manualForm.control}
                          name="requirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Requirements</FormLabel>
                              <FormControl>
                                <Textarea placeholder="List the requirements for completing the challenge." className="min-h-[100px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={manualForm.control}
                          name="setupInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setup Instructions</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Provide instructions on how to set up the challenge environment." className="min-h-[100px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Touch Points/Flags Section */}
                        <div>
                            <Label>Touch Points / Flags</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    placeholder="Add a touch point description..."
                                    value={newTouchPointDescription}
                                    onChange={(e) => setNewTouchPointDescription(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter') { handleAddTouchPoint(); } }}
                                />
                                <Button type="button" onClick={handleAddTouchPoint} disabled={!newTouchPointDescription.trim()}>Add</Button>
                            </div>
                             <div className="mt-2 space-y-2">
                                {touchPoints.map((tp) => (
                                    <div key={tp.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        <span>{tp.description}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveTouchPoint(tp.id)}>
                                            <MinusCircle className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !manualForm.formState.isValid}>
                           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Create Manual Challenge
                        </Button>
                    </form>
                 </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {result && (
        <ChallengeResultDialog
          isOpen={isResultOpen}
          setIsOpen={setIsResultOpen}
          result={result}
        />
      )}
    </>
  );
}
