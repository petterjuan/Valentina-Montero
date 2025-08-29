"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput } from "@/ai/flows/generate-personalized-workout";
import { z } from "zod";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  equipment: z.string(),
  duration: z.coerce.number(),
  frequency: z.coerce.number(),
});

export type AiGeneratorFormState = {
  data?: string;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

export async function handleAiGeneration(input: GeneratePersonalizedWorkoutInput): Promise<AiGeneratorFormState> {
  try {
    const result = await generatePersonalizedWorkout(input);
    return { data: result.workoutPlan, inputs: input };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}
