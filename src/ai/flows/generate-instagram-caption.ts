'use server';

/**
 * @fileOverview An AI agent for generating Instagram captions.
 *
 * - generateInstagramCaption - A function that generates an Instagram caption based on a topic or image description.
 * - GenerateInstagramCaptionInput - The input type for the generateInstagramCaption function.
 * - GenerateInstagramCaptionOutput - The return type for the generateInstagramCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInstagramCaptionInputSchema = z.object({
  topic: z
    .string()
    .describe("The topic or subject of the Instagram post.  It could also be an image description."),
});
export type GenerateInstagramCaptionInput = z.infer<typeof GenerateInstagramCaptionInputSchema>;

const GenerateInstagramCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated Instagram caption.'),
});
export type GenerateInstagramCaptionOutput = z.infer<typeof GenerateInstagramCaptionOutputSchema>;

export async function generateInstagramCaption(input: GenerateInstagramCaptionInput): Promise<GenerateInstagramCaptionOutput> {
  return generateInstagramCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInstagramCaptionPrompt',
  input: {schema: GenerateInstagramCaptionInputSchema},
  output: {schema: GenerateInstagramCaptionOutputSchema},
  prompt: `You are an expert social media manager, specialized in writing engaging instagram captions.  Write an engaging instagram caption about the following topic:

{{topic}}`,
});

const generateInstagramCaptionFlow = ai.defineFlow(
  {
    name: 'generateInstagramCaptionFlow',
    inputSchema: GenerateInstagramCaptionInputSchema,
    outputSchema: GenerateInstagramCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
