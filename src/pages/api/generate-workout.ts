
import { NextApiRequest, NextApiResponse } from 'next';
import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput } from '@/ai/flows/generate-personalized-workout';
import { logEvent } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const input: GeneratePersonalizedWorkoutInput = req.body;
        
        // Basic validation
        if (!input.fitnessGoal || !input.experienceLevel || !input.equipment || !input.workoutFocus) {
             return res.status(400).json({ message: 'Missing required workout parameters.' });
        }

        const workoutPlan = await generatePersonalizedWorkout(input);
        return res.status(200).json(workoutPlan);

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Centralized error logging
        logEvent(
            'AI Workout Generation Failed', 
            { 
                error: errorMessage, 
                stack: error instanceof Error ? error.stack : undefined, 
                input: req.body 
            }, 
            'error'
        );
        
        // Handle specific, user-facing errors
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
            if (errorMessage.includes('billing is not enabled')) {
                return res.status(500).json({ message: "La API de IA requiere que la facturación esté habilitada en el proyecto de Google Cloud. Esto es un requisito de Google para usar las APIs de IA, pero el uso del generador debería permanecer dentro de la capa gratuita." });
            }
            if (errorMessage.includes('API has not been used')) {
                 return res.status(500).json({ message: "La API de Vertex AI necesita ser habilitada en el proyecto de Google Cloud. Por favor, habilítala en la consola de Google Cloud y espera unos minutos." });
            }
        }
         if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404') || errorMessage.includes('does not exist')) {
            return res.status(500).json({ message: "El modelo de IA solicitado no está disponible. Es posible que tu proyecto no tenga acceso a este modelo. Contacta al soporte."});
         }

        // Generic error for other cases
        return res.status(500).json({ message: `Error al generar el entrenamiento: ${errorMessage}` });
    }
}
