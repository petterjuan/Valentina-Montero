
'use server';

/**
 * @fileOverview Un agente de IA para generar artículos de blog completos y optimizados para SEO.
 *
 * - generateBlogPost - Una función que crea un nuevo artículo de blog.
 * - GenerateBlogPostInput - El tipo de entrada para la función.
 * - GenerateBlogPostOutput - El tipo de retorno para la función.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import slugify from 'slugify';

const GenerateBlogPostInputSchema = z.object({
  existingTitles: z.array(z.string()).describe('Una lista de títulos de blogs ya existentes para evitar repeticiones.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('El título del artículo, optimizado para SEO y atractivo.'),
  excerpt: z.string().describe('Un resumen muy corto y atractivo (2-3 frases) del artículo para previsualizaciones, que incite a hacer clic.'),
  content: z.string().describe('El contenido completo del artículo, en formato HTML (usando etiquetas <p>, <h2>, <ul>, <li>, etc.).'),
  imageUrl: z.string().url().describe('La URL de una imagen de stock relevante para el artículo.'),
  aiHint: z.string().describe('Dos palabras clave en inglés para la imagen (ej. "fitness woman").'),
});
// We don't export the direct Zod schema output type because we add the slug manually.
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema> & { slug: string };


export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}


const generateBlogPostPrompt = ai.definePrompt({
    name: 'generateBlogPostPrompt',
    input: { schema: GenerateBlogPostInputSchema },
    output: { schema: GenerateBlogPostOutputSchema },
    model: 'gemini-1.5-flash',
    system: "Responde únicamente con el objeto JSON solicitado, sin texto adicional, explicaciones o formato markdown.",
    prompt: `
        Actúa como Valentina Montero, una experta en fitness, nutrición y coach personal con un tono cercano, motivador y profesional. Tu tarea es escribir un artículo de blog completo para su sitio web.

        **Instrucciones Clave:**
        1.  **Originalidad:** Elige un tema NUEVO y relevante sobre fitness, nutrición, mentalidad o bienestar para mujeres que NO esté en esta lista de títulos existentes: {{{existingTitles}}}.
        2.  **Longitud y Estructura:** Escribe un artículo de entre 800 y 1200 palabras. Debe tener una estructura clara:
            *   Una introducción que enganche al lector.
            *   Al menos 3-4 secciones con subtítulos (usando etiquetas <h2>).
            *   Contenido práctico y basado en evidencia. Usa listas con viñetas (<ul>, <li>) para dar consejos claros.
            *   Una conclusión que resuma las ideas clave y motive al lector a tomar acción.
        3.  **Formato HTML:** El campo 'content' DEBE estar en formato HTML válido.
        4.  **Tono y Voz:** Mantén siempre la voz de Valentina: empoderadora, conocedora pero accesible.
        5.  **Imagen:** Genera una URL de imagen de picsum.photos (ej. https://picsum.photos/seed/algun-seed/1200/800) y dos palabras clave en inglés para el 'aiHint'.
        6.  **Resumen Corto:** El 'excerpt' debe ser muy breve y directo (2-3 frases) para generar curiosidad.
    `,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: z.object({
        title: z.string(),
        slug: z.string(),
        excerpt: z.string(),
        content: z.string(),
        imageUrl: z.string().url(),
        aiHint: z.string(),
    }),
  },
  async (input) => {
    const { output } = await generateBlogPostPrompt(input);
    if (!output) {
      throw new Error('La respuesta de la IA no tuvo contenido.');
    }
    
    const slug = slugify(output.title, { lower: true, strict: true });

    return {
        ...output,
        slug,
    };
  }
);

    