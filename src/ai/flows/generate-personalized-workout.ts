
'use server';

/**
 * @fileOverview Un agente que genera planes de entrenamiento personalizados basados en los objetivos del usuario.
 *
 * - generatePersonalizedWorkout - Una función que genera un plan de entrenamiento personalizado.
 * - GeneratePersonalizedWorkoutInput - El tipo de entrada para la función generatePersonalizedWorkout.
 * - GeneratePersonalizedWorkoutOutput - El tipo de retorno para la función generatePersonalizedWorkout.
 */
import { z } from 'zod';
import { google } from 'googleapis';

// Helper function to get Google Auth client
async function getAuthClient() {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("Firebase service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set in environment variables.");
    }
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedKey);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    return await auth.getClient();
}

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

// Main exported function
export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
      throw new Error("Firebase service account key not configured.");
  }
  const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
  const credentials = JSON.parse(decodedKey);
  const projectId = credentials.project_id;
    
  if(!projectId) {
      throw new Error("Could not determine project_id from service account key.");
  }

  const promptText = `
    Eres una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. 
    Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones.

    - **Objetivo de Fitness:** ${input.fitnessGoal}
    - **Nivel de Experiencia:** ${input.experienceLevel}
    - **Equipo Disponible:** ${input.equipment}
    - **Enfoque Principal:** ${input.workoutFocus}
    - **Duración por Sesión:** ${input.duration} minutos
    - **Frecuencia Semanal:** ${input.frequency} veces por semana

    Tu única respuesta debe ser un objeto JSON válido que se ajuste al siguiente schema. No incluyas ningún texto, explicación o formato markdown adicional.

    Schema:
    ${JSON.stringify(GeneratePersonalizedWorkoutOutputSchema.describe('El plan de entrenamiento completo'), null, 2)}
  `;

  try {
    const auth = await getAuthClient();
    const accessToken = (await auth.getAccessToken()).token;

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: promptText }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        })
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google AI API request failed with status ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();

    const candidate = responseData.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
      throw new Error('Invalid response structure from Google AI API');
    }
    
    const jsonText = candidate.content.parts[0].text;
    const parsedOutput = JSON.parse(jsonText);
    
    return GeneratePersonalizedWorkoutOutputSchema.parse(parsedOutput);

  } catch (error) {
    console.error('Error in generatePersonalizedWorkout:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI plan generation.";
    throw new Error(errorMessage);
  }
}
