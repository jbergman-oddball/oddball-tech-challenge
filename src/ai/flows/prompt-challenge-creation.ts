
'use server';

/**
 * @fileOverview AI agent to allow interviewers to prompt specific coding challenges.
 *
 * - promptChallengeCreation - A function that handles the challenge creation process based on a prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PromptChallengeCreationInputSchema, PromptChallengeCreationOutputSchema } from '@/types/schemas';
import { PromptChallengeCreationInput, PromptChallengeCreationOutput } from '@/types';


export async function promptChallengeCreation(
  input: PromptChallengeCreationInput
): Promise<PromptChallengeCreationOutput> {
  return promptChallengeCreationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'promptChallengeCreationPrompt',
  input: {schema: PromptChallengeCreationInputSchema},
  output: {schema: PromptChallengeCreationOutputSchema},
  prompt: `You are an expert coding challenge designer. An interviewer has requested a challenge based on the prompt below. Your job is to generate a detailed coding challenge description, instructions for setting up the coding environment in VSCode.dev, and the expected output or solution for the challenge.

Prompt: {{{prompt}}}`,
});

const promptChallengeCreationFlow = ai.defineFlow(
  {
    name: 'promptChallengeCreationFlow',
    inputSchema: PromptChallengeCreationInputSchema,
    outputSchema: PromptChallengeCreationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
