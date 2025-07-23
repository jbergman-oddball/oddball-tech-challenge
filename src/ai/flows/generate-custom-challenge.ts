
'use server';

/**
 * @fileOverview Automatically generates coding challenges tailored to a candidate's resume and job title.
 *
 * - generateCustomChallenge - A function that handles the generation of custom coding challenges.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateCustomChallengeInputSchema, GenerateCustomChallengeOutputSchema } from '@/types/schemas';
import { GenerateCustomChallengeInput, GenerateCustomChallengeOutput } from '@/types';


export async function generateCustomChallenge(
  input: GenerateCustomChallengeInput
): Promise<GenerateCustomChallengeOutput> {
  return generateCustomChallengeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomChallengePrompt',
  input: {schema: GenerateCustomChallengeInputSchema},
  output: {schema: GenerateCustomChallengeOutputSchema},
  prompt: `You are an expert in creating coding challenges for technical interviews. Given a candidate's resume and the job title they are applying for, create a coding challenge that assesses their skills and abilities.

Resume: {{{resume}}}
Job Title: {{{jobTitle}}}

Consider the candidate's skills and experience when designing the challenge. The challenge should be relevant to the job title and should assess the candidate's ability to solve problems, write clean code, and communicate their solutions effectively. Provide setup instructions for vscode.dev

Output the challenge description, required skills, and setup instructions in JSON format.  The required skills should be comma seperated.
`,
});

const generateCustomChallengeFlow = ai.defineFlow(
  {
    name: 'generateCustomChallengeFlow',
    inputSchema: GenerateCustomChallengeInputSchema,
    outputSchema: GenerateCustomChallengeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
