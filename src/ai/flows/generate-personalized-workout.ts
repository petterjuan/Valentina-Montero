
'use server';

/**
 * @fileOverview Un agente que genera planes de entrenamiento personalizados basados en los objetivos del usuario, utilizando Genkit.
 *
 * - generatePersonalizedWorkout - Una función que genera un plan de entrenamiento personalizado.
 * - GeneratePersonalizedWorkoutInput - El tipo de entrada para la función.
 * - GeneratePersonalizedWorkoutOutput - El tipo de retorno para la función.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logEvent } from '@/lib/logger';

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
  nutritionTips: z.array(z.string()).describe('Una lista de 3 consejos de nutrición prácticos y alineados con el objetivo del usuario. DEBEN ESTAR EN ESPAÑOL.'),
  mindsetTips: z.array(z.string()).describe('Una lista de 2 consejos de mentalidad o motivación para ayudar al usuario a mantenerse en el camino. DEBEN ESTAR EN ESPAÑOL.'),
});
export type GeneratePersonalizedWorkoutOutput = z.infer<typeof GeneratePersonalizedWorkoutOutputSchema>;

// Wrapper function to be called by server actions
export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  return generatePersonalizedWorkoutFlow(input);
}

const generateWorkoutPrompt = ai.definePrompt({
    name: 'generateWorkoutPrompt',
    input: { schema: GeneratePersonalizedWorkoutInputSchema },
    output: { schema: GeneratePersonalizedWorkoutOutputSchema },
    model: googleAI.model('gemini-1.5-flash-preview-0514'),
    system: "Actúa como una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. Tu única respuesta debe ser un objeto JSON válido que se ajuste al schema proporcionado. No incluyas ningún texto, explicación o formato markdown adicional, solo el JSON. TODO el texto de tu respuesta DEBE estar en español.",
    prompt: `Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones:
    - **Objetivo de Fitness:** {{{fitnessGoal}}}
    - **Nivel de Experiencia:** {{{experienceLevel}}}
    - **Equipo Disponible:** {{{equipment}}}
    - **Enfoque Principal:** {{{workoutFocus}}}
    - **Duración por Sesión:** {{{duration}}} minutos
    - **Frecuencia Semanal:** {{{frequency}}} veces por semana}`
});


const generatePersonalizedWorkoutFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedWorkoutFlow',
    inputSchema: GeneratePersonalizedWorkoutInputSchema,
    outputSchema: GeneratePersonalizedWorkoutOutputSchema,
  },
  async (input) => {
    try {
        const { output } = await generateWorkoutPrompt(input);
        if (!output) {
            throw new Error("La IA no devolvió contenido.");
        }
        return output;
    } catch(error) {
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
);
