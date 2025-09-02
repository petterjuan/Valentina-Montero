'use server';

/**
 * @fileOverview Un agente que genera planes de entrenamiento personalizados basados en los objetivos del usuario.
 *
 * - generatePersonalizedWorkout - Una función que genera un plan de entrenamiento personalizado.
 * - GeneratePersonalizedWorkoutInput - El tipo de entrada para la función generatePersonalizedWorkout.
 * - GeneratePersonalizedWorkoutOutput - El tipo de retorno para la función generatePersonalizedWorkout.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedWorkoutInputSchema = z.object({
  fitnessGoal: z.string().describe('El objetivo de fitness especificado por el usuario (p. ej., perder peso, ganar músculo).'),
  experienceLevel: z.string().describe('El nivel de experiencia del usuario (principiante, intermedio, avanzado).'),
  equipment: z.string().describe('El equipo de ejercicio disponible para el usuario.'),
  duration: z.number().describe('La duración de la sesión de entrenamiento en minutos.'),
  frequency: z.number().describe('La frecuencia con la que el usuario planea hacer ejercicio por semana.'),
});
export type GeneratePersonalizedWorkoutInput = z.infer<typeof GeneratePersonalizedWorkoutInputSchema>;

const GeneratePersonalizedWorkoutOutputSchema = z.object({
  workoutPlan: z
    .string()
    .describe('Un plan de entrenamiento personalizado basado en el objetivo de fitness del usuario.'),
});
export type GeneratePersonalizedWorkoutOutput = z.infer<typeof GeneratePersonalizedWorkoutOutputSchema>;

export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  return generatePersonalizedWorkoutFlow(input);
}

const generatePersonalizedWorkoutPrompt = ai.definePrompt({
  name: 'generatePersonalizedWorkoutPrompt',
  input: {schema: GeneratePersonalizedWorkoutInputSchema},
  output: {schema: GeneratePersonalizedWorkoutOutputSchema},
  prompt: `Eres un entrenador personal experto. Crea un plan de entrenamiento detallado en español basado en las siguientes especificaciones.

- **Objetivo de Fitness:** {{{fitnessGoal}}}
- **Nivel de Experiencia:** {{{experienceLevel}}}
- **Equipo Disponible:** {{{equipment}}}
- **Duración por Sesión:** {{{duration}}} minutos
- **Frecuencia Semanal:** {{{frequency}}} veces por semana

**Instrucción importante:** Tu respuesta debe contener únicamente el plan de entrenamiento. No incluyas frases introductorias, saludos o resúmenes. Comienza directamente con la estructura del plan (por ejemplo, "Día 1: Calentamiento...").`,
});

const generatePersonalizedWorkoutFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedWorkoutFlow',
    inputSchema: GeneratePersonalizedWorkoutInputSchema,
    outputSchema: GeneratePersonalizedWorkoutOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedWorkoutPrompt(input);
    if (!output) {
      throw new Error('La respuesta de la IA no tuvo contenido.');
    }
    const parsedOutput = GeneratePersonalizedWorkoutOutputSchema.parse(output);
    return { workoutPlan: parsedOutput.workoutPlan };
  }
);
