
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  equipment: z.string(),
  duration: z.number(),
  frequency: z.number(),
});

export type AiGeneratorFormState = {
  data?: GeneratePersonalizedWorkoutOutput;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

export async function handleAiGeneration(input: GeneratePersonalizedWorkoutInput): Promise<AiGeneratorFormState> {
  try {
    const validatedInput = aiGeneratorSchema.parse(input);
    const result = await generatePersonalizedWorkout(validatedInput);
    return { data: result, inputs: validatedInput };
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      return { error: "Los datos de entrada no son válidos. Por favor, revisa el formulario." };
    }
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}

export async function handlePlanSignup(input: PlanSignupInput) {
  try {
    const result = await processPlanSignup(input);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo." };
  }
}


const leadSchema = z.object({
    email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

export async function handleLeadSubmission(formData: { email: string }) {
    try {
        const { email } = leadSchema.parse(formData);

        const client = await clientPromise;
        const db = client.db();
        
        await db.collection("leads").insertOne({
            email,
            source: "Guía Gratuita - 10k Pasos",
            createdAt: new Date(),
        });
        
        return { success: true, message: "¡Éxito! Tu guía está en camino." };
    } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
            return { success: false, message: e.errors[0].message };
        }
        return { success: false, message: "Hubo un problema con tu solicitud. Por favor, inténtalo de nuevo." };
    }
}
