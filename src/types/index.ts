
import { z } from "zod";
import { GenerateCustomChallengeOutputSchema, PromptChallengeCreationOutputSchema } from "./schemas";

export type Challenge = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Reviewed';
  createdAt: Date;
  challengeDescription: string;
  requiredSkills: string;
  setupInstructions: string;
  expectedOutput?: string;
};

export type UserProfile = {
    uid: string;
    name: string;
    email: string;
    role: 'pending' | 'user' | 'admin';
    status: 'pending-approval' | 'active' | 'suspended';
    createdAt: Date;
    photoURL?: string;
}

export type GenerateCustomChallengeInput = z.infer<typeof GenerateCustomChallengeInputSchema>;
export type GenerateCustomChallengeOutput = z.infer<typeof GenerateCustomChallengeOutputSchema>;
export type PromptChallengeCreationInput = z.infer<typeof PromptChallengeCreationInputSchema>;
export type PromptChallengeCreationOutput = z.infer<typeof PromptChallengeCreationOutputSchema>;

export type CustomChallengeResult = GenerateCustomChallengeOutput;
export type PromptedChallengeResult = PromptChallengeCreationOutput;

export type ChallengeResult = CustomChallengeResult | PromptedChallengeResult;

import { GenerateCustomChallengeInputSchema, PromptChallengeCreationInputSchema } from "./schemas";
