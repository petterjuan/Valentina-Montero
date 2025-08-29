'use server';

/**
 * @fileOverview An AI agent that generates personalized workout plans based on user goals.
 *
 * - generatePersonalizedWorkout - A function that generates a personalized workout plan.
 * - GeneratePersonalizedWorkoutInput - The input type for the generatePersonalizedWorkout function.
 * - GeneratePersonalizedWorkoutOutput - The return type for the generatePersonalizedWorkout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedWorkoutInputSchema = z.object({
  fitnessGoal: z
    .string()
    .describe('The user specified fitness goal (e.g., lose weight, gain muscle).'),
});
export type GeneratePersonalizedWorkoutInput = z.infer<typeof GeneratePersonalizedWorkoutInputSchema>;

const GeneratePersonalizedWorkoutOutputSchema = z.object({
  workoutPlan: z
    .string()
    .describe('A personalized workout plan based on the user fitness goal.'),
});
export type GeneratePersonalizedWorkoutOutput = z.infer<typeof GeneratePersonalizedWorkoutOutputSchema>;

export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  return generatePersonalizedWorkoutFlow(input);
}

const generatePersonalizedWorkoutPrompt = ai.definePrompt({
  name: 'generatePersonalizedWorkoutPrompt',
  input: {schema: GeneratePersonalizedWorkoutInputSchema},
  output: {schema: GeneratePersonalizedWorkoutOutputSchema},
  prompt: `You are a personal trainer who specializes in creating workout plans.

  Based on the user's fitness goal, create a workout plan that will help them achieve their goal.
  Fitness Goal: {{{fitnessGoal}}}`,
});

const generatePersonalizedWorkoutFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedWorkoutFlow',
    inputSchema: GeneratePersonalizedWorkoutInputSchema,
    outputSchema: GeneratePersonalizedWorkoutOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedWorkoutPrompt(input);
    return output!;
  }
);
