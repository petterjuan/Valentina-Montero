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
  weeklySchedule: z.array(DailyWorkoutSchema).describe('El plan de entrenamiento semanal, dividido por días.'),
  recommendations: z.array(z.string()).describe('Recomendaciones adicionales sobre nutrición, descanso, etc.'),
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
- **Duración por Sesión:** {{{duration}}} minutos
- **Frecuencia Semanal:** {{{frequency}}} veces por semana

**Instrucciones de formato de salida (MUY IMPORTANTE):**
- Debes devolver la respuesta únicamente en el formato JSON especificado.
- En el campo 'overview', escribe una frase corta y motivadora.
- Para cada 'day' en 'weeklySchedule', crea un plan de entrenamiento completo.
- En el campo 'focus' de cada día, especifica el grupo muscular principal (ej. "Tren Inferior", "Full Body", "Cardio y Core").
- Los ejercicios deben ser una lista de objetos, cada uno con 'name', 'sets' y 'reps'. Sé específica con las series y repeticiones (ej. "3 series", "10-12 reps").
- En 'recommendations', proporciona 3 o 4 consejos clave y concisos.
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
