
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase";
import { logEvent } from "@/lib/logger";

// Schemas
const leadSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

const aiGeneratorClientSchema = z.object({
  fitnessGoal: z.string().min(1, "El objetivo de fitness es requerido"),
  experienceLevel: z.string().min(1, "El nivel de experiencia es requerido"),
  equipment: z.string().min(1, "El equipo disponible es requerido"),
  workoutFocus: z.string().min(1, "El enfoque es requerido"),
  duration: z.coerce.number().min(1, "La duración debe ser mayor a 0"),
  frequency: z.coerce.number().min(1, "La frecuencia debe ser mayor a 0"),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal('')),
});
type AiGeneratorFormData = z.infer<typeof aiGeneratorClientSchema>;

// Types
export type AiGeneratorFormState = {
  data?: GeneratePersonalizedWorkoutOutput;
  error?: string;
  inputs?: AiGeneratorFormData;
  isFullPlan?: boolean;
};

// Server Actions
export async function handleAiGeneration(
  validatedInput: AiGeneratorFormData,
  existingData?: GeneratePersonalizedWorkoutOutput
): Promise<AiGeneratorFormState> {
  
  try {
    // This is the "unlock" flow. We have the user's email and the existing plan.
    // We just log the lead and return the existing data as a "full plan".
    if (existingData && validatedInput.email) {
      const firestore = getFirestore();
      if (firestore) {
        const now = new Date();
        const leadRef = firestore.collection("leads").doc(validatedInput.email.toLowerCase());

        const leadData = {
          email: validatedInput.email,
          source: "IA Workout - Full Plan",
          status: "subscribed",
          tags: {
            goal: validatedInput.fitnessGoal,
            level: validatedInput.experienceLevel,
            focus: validatedInput.workoutFocus,
          },
          updatedAt: now,
        };
        
        await leadRef.set(leadData, { merge: true });
      }
      return { data: existingData, inputs: validatedInput, isFullPlan: true };
    }

    // This is the "preview" generation flow.
    const { email, ...workoutInput } = validatedInput;
    const result = await generatePersonalizedWorkout(workoutInput);
    if (!result) {
      throw new Error("The AI failed to return any content for the workout plan.");
    }
    return { data: result, inputs: validatedInput, isFullPlan: false };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logEvent('AI Workout Generation Failed', { 
        error: errorMessage, 
        stack: errorStack,
        input: validatedInput
    }, 'error');
    
    return { 
      error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." 
    };
  }
}


export async function handlePlanSignup(input: PlanSignupInput) {
  try {
    if (!input) {
      logEvent('Stripe Payment Error', { error: 'Input data is missing for handlePlanSignup' }, 'error');
      return { data: null, error: "Los datos de entrada son requeridos." };
    }
    const result = await processPlanSignup(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in handlePlanSignup:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    let userErrorMessage = "Ocurrió un error al procesar tu pago. Por favor, inténtalo de nuevo.";
    
    // Log more detailed error for admin, but show user-friendly message
    if (errorMessage.includes('STRIPE_SECRET_KEY') || errorMessage.includes('Invalid API Key')) {
        userErrorMessage = "El sistema de pagos no está configurado correctamente. Por favor, contacta al administrador.";
        logEvent('Stripe Payment Failed', { error: 'Stripe secret key is invalid or missing.', input: input }, 'error');
    } else if (errorMessage.includes('NEXT_PUBLIC_APP_URL')) {
        userErrorMessage = "Error de configuración del servidor. Por favor, contacta al administrador.";
        logEvent('Stripe Payment Failed', { error: 'NEXT_PUBLIC_APP_URL is not set.', input: input }, 'error');
    } else {
        logEvent('Stripe Payment Failed', { error: errorMessage, input: input }, 'error');
    }
    
    return { 
      data: null, 
      error: userErrorMessage,
    };
  }
}

export async function handleLeadSubmission(formData: { email: string }) {
  try {
    const { email } = leadSchema.parse(formData);

    const firestore = getFirestore();
    if (!firestore) {
      console.error("Firestore not configured");
      return { success: false, message: "Servicio temporalmente no disponible. Por favor, inténtalo más tarde." };
    }

    const now = new Date();
    const leadRef = firestore.collection("leads").doc(email.toLowerCase());

    const leadData = {
      email,
      source: "Guía Gratuita - 10k Pasos",
      status: "subscribed",
      updatedAt: now,
      createdAt: now,
    };
    
    await leadRef.set(leadData, { merge: true });

    return {
      success: true,
      message: "¡Éxito! Tu guía se está descargando.",
      downloadUrl: "/guia-10k-pasos.pdf"
    };
  } catch (error) {
    console.error("Error in handleLeadSubmission:", error instanceof Error ? error.stack : String(error));
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message || "Email inválido." };
    }
    return { success: false, message: "Hubo un problema con tu solicitud. Por favor, inténtalo de nuevo." };
  }
}

export async function logConversion(variationId: string) {
    'use server';
    try {
        const firestore = getFirestore();
        if (!firestore) {
            // Log to console if Firestore isn't available, but don't throw an error to the client.
            console.warn('Logger: Firestore not available. Could not log conversion.', { variationId });
            return { success: false, error: 'Logging service unavailable.' };
        }

        const conversionData = {
            variationId,
            clickedAt: new Date(),
            page: '/muscle-bites',
        };

        await firestore.collection('conversions').add(conversionData);

        return { success: true };
    } catch (error) {
        // Log the detailed error on the server for debugging
        console.error('Failed to log conversion to Firestore:', error);
        logEvent('Conversion Logging Failed', { variationId, error: error instanceof Error ? error.message : String(error) }, 'error');
        
        // Return a generic error to the client
        return { success: false, error: 'Failed to log conversion event.' };
    }
}
