
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

// Schemas (los mismos que antes)
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


// Nueva función que llama directamente a la API de Google
export async function generatePersonalizedWorkout(
  input: GeneratePersonalizedWorkoutInput
): Promise<GeneratePersonalizedWorkoutOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clave de API de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno.");
  }

  // Usamos un modelo que sabemos que es accesible y gratuito para este tipo de uso.
  const model = 'gemini-1.5-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = "Actúa como una entrenadora personal experta llamada Valentina Montero. Tu tono es motivador, cercano y profesional. Tu única respuesta debe ser un objeto JSON válido que se ajuste al schema proporcionado. No incluyas ningún texto, explicación o formato markdown adicional, solo el JSON.";

  const userPrompt = `Crea un plan de entrenamiento detallado y estructurado en español basado en las siguientes especificaciones:
    - **Objetivo de Fitness:** ${input.fitnessGoal}
    - **Nivel de Experiencia:** ${input.experienceLevel}
    - **Equipo Disponible:** ${input.equipment}
    - **Enfoque Principal:** ${input.workoutFocus}
    - **Duración por Sesión:** ${input.duration} minutos
    - **Frecuencia Semanal:** ${input.frequency} veces por semana`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          overview: { type: "STRING" },
          fullWeekWorkout: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                day: { type: "STRING" },
                focus: { type: "STRING" },
                warmup: { type: "STRING" },
                exercises: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      sets: { type: "STRING" },
                      reps: { type: "STRING" },
                    },
                    required: ["name", "sets", "reps"],
                  },
                },
                cooldown: { type: "STRING" },
              },
              required: ["day", "focus", "warmup", "exercises", "cooldown"],
            },
          },
          nutritionTips: { type: "ARRAY", items: { type: "STRING" } },
          mindsetTips: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["overview", "fullWeekWorkout", "nutritionTips", "mindsetTips"],
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `La solicitud a la API de Google AI falló con estado ${response.status}: ${errorBody}`;
        logEvent('Google AI API Error', { status: response.status, body: errorBody, request: requestBody }, 'error');
        throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // El contenido JSON real está dentro de `candidates[0].content.parts[0].text`
    const jsonText = data.candidates[0].content.parts[0].text;
    const parsedOutput = JSON.parse(jsonText);
    
    // Validar con Zod para asegurar la estructura
    return GeneratePersonalizedWorkoutOutputSchema.parse(parsedOutput);

  } catch (error) {
    if (error instanceof Error) {
        logEvent('AI Workout Generation Failed', { error: error.message, stack: error.stack }, 'error');
    } else {
        logEvent('AI Workout Generation Failed', { error: String(error) }, 'error');
    }
    throw error; // Re-lanzar el error para que sea manejado por el llamador
  }
}
