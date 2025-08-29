"use server";

import { generatePersonalizedWorkout } from "@/ai/flows/generate-personalized-workout";
import { z } from "zod";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  equipment: z.string(),
  duration: z.string().transform(v => Number(v)),
  frequency: z.string().transform(v => Number(v)),
});

type AiState = {
  data?: string;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

export async function handleAiGeneration(prevState: AiState, formData: FormData): Promise<AiState> {
  const validatedFields = aiGeneratorSchema.safeParse({
    fitnessGoal: formData.get("fitnessGoal"),
    experienceLevel: formData.get("experienceLevel"),
    equipment: formData.get("equipment"),
    duration: formData.get("duration"),
    frequency: formData.get("frequency"),
  });
  
  if (!validatedFields.success) {
    return {
      error: "Por favor, completa todos los campos para generar tu plan.",
    };
  }

  const input = validatedFields.data;
  
  const prompt = `Objetivo: ${input.fitnessGoal}, Nivel: ${input.experienceLevel}, Equipo: ${input.equipment}, Duración: ${input.duration} min, Frecuencia: ${input.frequency} veces/semana`;

  try {
    const result = await generatePersonalizedWorkout({ fitnessGoal: prompt });
    return { data: result.workoutPlan, inputs: input };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}
