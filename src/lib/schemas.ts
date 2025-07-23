
import { z } from "zod";

export const CustomChallengeFormSchema = z.object({
    candidateName: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." }),
    candidateEmail: z.string().email({ message: "Please enter a valid email." }),
    jobTitle: z
      .string()
      .min(2, { message: "Job title must be at least 2 characters." }),
    resume: z
      .string()
      .min(100, { message: "Resume must be at least 100 characters." }),
  });
  
  export const PromptChallengeFormSchema = z.object({
    prompt: z
      .string()
      .min(20, { message: "Prompt must be at least 20 characters." }),
  });
