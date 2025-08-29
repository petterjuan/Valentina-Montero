"use server";

import { generateInstagramCaption } from "@/ai/flows/generate-instagram-caption";
import { generatePersonalizedWorkout } from "@/ai/flows/generate-personalized-workout";
import { z } from "zod";

const aiGeneratorSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters long."),
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

  const prompt = validatedFields.data.prompt.toLowerCase();

  try {
    if (prompt.includes("caption") || prompt.includes("ig") || prompt.includes("instagram")) {
      const result = await generateInstagramCaption({ topic: prompt });
      return { data: result.caption };
    } else {
      const result = await generatePersonalizedWorkout({ fitnessGoal: prompt });
      return { data: result.workoutPlan };
    }
  } catch (e) {
    console.error(e);
    return { error: "Failed to generate content. Please try again later." };
  }
}
