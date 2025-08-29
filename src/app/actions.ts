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
    const validatedInput = aiGeneratorSchema.parse(input);
    const result = await generatePersonalizedWorkout(validatedInput);
    return { data: result.workoutPlan, inputs: validatedInput };
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      return { error: "Los datos de entrada no son válidos. Por favor, revisa el formulario." };
    }
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}