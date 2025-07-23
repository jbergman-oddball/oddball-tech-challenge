
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
} from "@/lib/actions";
import { CustomChallengeFormSchema, PromptChallengeFormSchema } from "@/lib/schemas";
import { Loader2, PlusCircle } from "lucide-react";
import type { ChallengeResult, CustomChallengeResult, PromptedChallengeResult } from "@/types";
import { ChallengeResultDialog } from "./challenge-result-dialog";

export function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const { toast } = useToast();

  const customForm = useForm<z.infer<typeof CustomChallengeFormSchema>>({
    resolver: zodResolver(CustomChallengeFormSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      jobTitle: "",
      resume: "",
    },
  });

  const promptForm = useForm<z.infer<typeof PromptChallengeFormSchema>>({
    resolver: zodResolver(PromptChallengeFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onCustomSubmit(values: z.infer<typeof CustomChallengeFormSchema>) {
    setIsLoading(true);
    try {
      const challengeResult = await createCustomChallengeAction(values);
      setResult(challengeResult);
      setIsResultOpen(true);
      setOpen(false);
      customForm.reset();
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Custom from Resume</TabsTrigger>
              <TabsTrigger value="prompt">From Prompt</TabsTrigger>
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
                  <FormField
                    control={customForm.control}
                    name="resume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidate's Resume</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste resume text here..." className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
