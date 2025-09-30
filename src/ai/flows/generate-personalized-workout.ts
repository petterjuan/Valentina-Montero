
'use server';

/**
 * @fileOverview Un agente que genera planes de entrenamiento personalizados basados en los objetivos del usuario, utilizando Genkit.
 *
 * - generatePersonalizedWorkout - Una función que genera un plan de entrenamiento personalizado.
 * - GeneratePersonalizedWorkoutInput - El tipo de entrada para la función.
 * - GeneratePersonalizedWorkoutOutput - El tipo de retorno para la función.
 */
import { generate } from 'genkit/generate';
import { defineFlow, run } from 'genkit/flow';
import { geminiPro } from '@genkit-ai/googleai';
import { z } from 'zod';

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
  return await run(generatePersonalizedWorkoutFlow, input);
}

const generatePersonalizedWorkoutFlow = defineFlow(
  {
    name: 'generatePersonalizedWorkoutFlow',
    inputSchema: GeneratePersonalizedWorkoutInputSchema,
    outputSchema: GeneratePersonalizedWorkoutOutputSchema,
  },
  async (input) => {
    const prompt = `Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones:
    - **Objetivo de Fitness:** ${input.fitnessGoal}
    - **Nivel de Experiencia:** ${input.experienceLevel}
    - **Equipo Disponible:** ${input.equipment}
    - **Enfoque Principal:** ${input.workoutFocus}
    - **Duración por Sesión:** ${input.duration} minutos
    - **Frecuencia Semanal:** ${input.frequency} veces por semana}`;

    const llmResponse = await generate({
        prompt: prompt,
        model: geminiPro,
        system: "Actúa como una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. Tu única respuesta debe ser un objeto JSON válido que se ajuste al schema proporcionado. No incluyas ningún texto, explicación o formato markdown adicional, solo el JSON. TODO el texto de tu respuesta DEBE estar en español.",
        output: {
            schema: GeneratePersonalizedWorkoutOutputSchema,
            format: 'json',
        },
    });

    const output = llmResponse.output();
    if (!output) {
        throw new Error("La IA no devolvió contenido.");
    }
    return output;
  }
);
