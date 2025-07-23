
import { z } from "zod";

export const GenerateCustomChallengeInputSchema = z.object({
    resume: z
      .string()
      .describe("The candidate's resume text."),
    jobTitle: z.string().describe('The job title for which the candidate is being evaluated.'),
  });
  
  export const GenerateCustomChallengeOutputSchema = z.object({
    challengeDescription: z
      .string()
      .describe('A detailed description of the coding challenge, tailored to the candidate.'),
    requiredSkills: z.string().describe('A comma seperated list of the required skills for the challenge'),
    setupInstructions: z.string().describe('Instructions on how to setup the project in vscode.dev'),
  });

  export const PromptChallengeCreationInputSchema = z.object({
    prompt: z.string().describe('The prompt for creating a coding challenge.'),
  });
  
  export const PromptChallengeCreationOutputSchema = z.object({
    challengeDescription: z
      .string()
      .describe('The detailed description of the coding challenge.'),
    setupInstructions: z
      .string()
      .describe('Instructions for setting up the coding environment in VSCode.dev.'),
    expectedOutput: z
      .string()
      .describe('The expected output or solution for the challenge.'),
  });
