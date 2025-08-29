"use server";

import { generatePersonalizedWorkout } from "@/ai/flows/generate-personalized-workout";
import { z } from "zod";

const aiGeneratorSchema = z.object({
  prompt: z.string().min(5, "La descripción debe tener al menos 5 caracteres."),
});

type AiState = {
  data?: string;
  error?: string;
};

export async function handleAiGeneration(prevState: AiState, formData: FormData): Promise<AiState> {
  const validatedFields = aiGeneratorSchema.safeParse({
    prompt: formData.get("prompt"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.prompt?.[0],
    };
  }

  const prompt = validatedFields.data.prompt;

  try {
    const result = await generatePersonalizedWorkout({ fitnessGoal: prompt });
    return { data: result.workoutPlan };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}
