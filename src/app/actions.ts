"use server";

import { generatePersonalizedWorkout } from "@/ai/flows/generate-personalized-workout";
import { z } from "zod";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  equipment: z.string(),
  duration: z.number(),
  frequency: z.number(),
});

export type AiGeneratorFormState = {
  data?: string;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

export async function handleAiGeneration(prevState: AiGeneratorFormState, formData: FormData): Promise<AiGeneratorFormState> {
  const validatedFields = aiGeneratorSchema.safeParse({
    fitnessGoal: formData.get("fitnessGoal"),
    experienceLevel: formData.get("experienceLevel"),
    equipment: formData.get("equipment"),
    duration: Number(formData.get("duration")),
    frequency: Number(formData.get("frequency")),
  });
  
  if (!validatedFields.success) {
    return {
      error: "Por favor, completa todos los campos para generar tu plan.",
    };
  }

  const input = validatedFields.data;
  
  try {
    const result = await generatePersonalizedWorkout(input);
    return { data: result.workoutPlan, inputs: input };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}
