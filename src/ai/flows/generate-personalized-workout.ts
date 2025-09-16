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

export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  return generatePersonalizedWorkoutFlow(input);
}

const generatePersonalizedWorkoutPrompt = ai.definePrompt({
  name: 'generatePersonalizedWorkoutPrompt',
  input: {schema: GeneratePersonalizedWorkoutInputSchema},
  output: {schema: GeneratePersonalizedWorkoutOutputSchema},
  prompt: `Eres una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones.

- **Objetivo de Fitness:** {{{fitnessGoal}}}
- **Nivel de Experiencia:** {{{experienceLevel}}}
- **Equipo Disponible:** {{{equipment}}}
- **Enfoque Principal:** {{{workoutFocus}}}
- **Duración por Sesión:** {{{duration}}} minutos
- **Frecuencia Semanal:** {{{frequency}}} veces por semana

**Instrucciones de formato de salida (MUY IMPORTANTE):**
- Debes devolver la respuesta únicamente en el formato JSON especificado.
- **overview:** Escribe una frase corta y motivadora sobre el plan.
- **fullWeekWorkout:** Crea un plan de entrenamiento completo para la cantidad de días especificada en 'frequency'. El enfoque de cada día debe variar y estar alineado con el 'workoutFocus' general.
- **nutritionTips:** Proporciona 3 consejos de nutrición accionables y relevantes para el objetivo.
- **mindsetTips:** Proporciona 2 consejos de mentalidad o motivación para el éxito a largo plazo.
- Los ejercicios deben ser una lista de objetos, cada uno con 'name', 'sets' y 'reps'. Sé específica con las series y repeticiones (ej. "3 series", "10-12 reps").
- No incluyas saludos, despedidas ni ningún texto fuera de la estructura JSON.`,
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
    return parsedOutput;
  }
);
