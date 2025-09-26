
'use server';

/**
 * @fileOverview Un agente que genera planes de entrenamiento personalizados basados en los objetivos del usuario.
 *
 * - generatePersonalizedWorkout - Una función que genera un plan de entrenamiento personalizado.
 * - GeneratePersonalizedWorkoutInput - El tipo de entrada para la función generatePersonalizedWorkout.
 * - GeneratePersonalizedWorkoutOutput - El tipo de retorno para la función generatePersonalizedWorkout.
 */
import { z } from 'zod';
import { logEvent } from '@/lib/logger';
import { VertexAI } from '@google-cloud/vertexai';

// Schemas
const GeneratePersonalizedWorkoutInputSchema = z.object({
  fitnessGoal: z.string().describe('El objetivo de fitness especificado por el usuario (p. ej., perder peso, ganar músculo).'),
  experienceLevel: z.string().describe('El nivel de experiencia del usuario (principiante, intermedio, avanzado).'),
  equipment: z.string().describe('El equipo de ejercicio disponible para el usuario.'),
  workoutFocus: z.string().describe('El área de enfoque principal del entrenamiento (ej. Tren Superior, Full Body).'),
  duration: z.coerce.number().describe('La duración de la sesión de entrenamiento en minutos.'),
  frequency: z.coerce.number().describe('La frecuencia con la que el usuario planea hacer ejercicio por semana.'),
});
export type GeneratePersonalizedWorkoutInput = z.infer<typeof GeneratePersonalizedWorkoutInputSchema>;

const ExerciseSchema = z.object({
  name: z.string().describe('El nombre del ejercicio.'),
  sets: z.string().describe('El número de series a realizar.'),
  reps: z.string().describe('El número de repeticiones por serie.'),
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe('El día del entrenamiento (p. ej., "Día 1").'),
  focus: z.string().describe('El enfoque principal del día (p. ej., "Tren Inferior y Cardio").'),
  warmup: z.string().describe('Las instrucciones para el calentamiento.'),
  exercises: z.array(ExerciseSchema).describe('Una lista de los ejercicios a realizar.'),
  cooldown: z.string().describe('Las instrucciones para el enfriamiento.'),
});

const GeneratePersonalizedWorkoutOutputSchema = z.object({
  overview: z.string().describe('Un resumen corto y motivador del plan.'),
  fullWeekWorkout: z.array(DailyWorkoutSchema).describe('El plan de entrenamiento semanal completo, dividido por días.'),
  nutritionTips: z.array(z.string()).describe('Una lista de 3 consejos de nutrición prácticos y alineados con el objetivo del usuario.'),
  mindsetTips: z.array(z.string()).describe('Una lista de 2 consejos de mentalidad o motivación para ayudar al usuario a mantenerse en el camino.'),
});
export type GeneratePersonalizedWorkoutOutput = z.infer<typeof GeneratePersonalizedWorkoutOutputSchema>;

// Función que llama a la API de Vertex AI
export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {

  let serviceAccount;
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set.");
    }
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decodedKey);
  } catch (e) {
    logEvent('Vertex AI Auth Error', { error: 'Failed to parse service account key.' }, 'error');
    throw new Error('Server authentication configuration is invalid.');
  }

  const vertexAI = new VertexAI({
    project: serviceAccount.project_id,
    location: 'us-central1', // O la región que estés usando
    googleAuthOptions: {
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        },
        scopes:[
          'https://www.googleapis.com/auth/cloud-platform',
        ],
    }
  });

  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash-preview-0514', // Modelo que sabemos que está disponible en la capa gratuita
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: {
        role: 'system',
        parts: [{ text: "Actúa como una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. Tu única respuesta debe ser un objeto JSON válido que se ajuste al schema proporcionado. No incluyas ningún texto, explicación o formato markdown adicional, solo el JSON."}]
    },
  });

  const userPrompt = `Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones:
    - **Objetivo de Fitness:** ${input.fitnessGoal}
    - **Nivel de Experiencia:** ${input.experienceLevel}
    - **Equipo Disponible:** ${input.equipment}
    - **Enfoque Principal:** ${input.workoutFocus}
    - **Duración por Sesión:** ${input.duration} minutos
    - **Frecuencia Semanal:** ${input.frequency} veces por semana`;
  
  const request = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  };

  try {
    const resp = await generativeModel.generateContent(request);
    const jsonText = resp.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonText) {
        logEvent('Vertex AI Error', { message: 'Empty response from model', response: resp.response }, 'error');
        throw new Error("La IA no devolvió contenido.");
    }

    const parsedOutput = JSON.parse(jsonText);
    return GeneratePersonalizedWorkoutOutputSchema.parse(parsedOutput);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logEvent('AI Workout Generation Failed', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined, input: input }, 'error');
    
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        if (errorMessage.includes('BILLING_DISABLED')) {
            throw new Error("La API de IA requiere que la facturación esté habilitada en el proyecto de Google Cloud. Esto es un requisito de Google para usar las APIs de IA, pero el uso del generador debería permanecer dentro de la capa gratuita.");
        }
        if (errorMessage.includes('API has not been used')) {
             throw new Error("La API de Vertex AI necesita ser habilitada en el proyecto de Google Cloud. Por favor, habilítala en la consola de Google Cloud y espera unos minutos.");
        }
    }
     if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
        throw new Error("El modelo de IA solicitado no está disponible. Es posible que tu proyecto no tenga acceso a este modelo. Contacta al soporte.");
     }

    throw new Error(`Error al generar el entrenamiento: ${errorMessage}`);
  }
}
