
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

  // Define the schema for manual challenge creation
  export const ManualChallengeFormSchema = z.object({
      title: z.string().min(5, { message: "Challenge title must be at least 5 characters." }),
      description: z.string().min(20, { message: "Description must be at least 20 characters." }),
      requirements: z.string().min(10, { message: "Requirements must be at least 10 characters." }),
      setupInstructions: z.string().min(10, { message: "Setup instructions must be at least 10 characters." }),
      // Touch points will be an array of objects
      touchPoints: z.array(z.object({ 
           id: z.string(), // Assuming touch points have a unique ID
           description: z.string().min(1, { message: "Touch point description cannot be empty." }),
      })).optional(), // Make touch points optional for now
  });
