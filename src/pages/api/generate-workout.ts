
import { NextApiRequest, NextApiResponse } from 'next';
import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput } from '@/ai/flows/generate-personalized-workout';

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
        console.error("Error in /api/generate-workout:", error);
        const errorMessage = error.message || "An unexpected error occurred while generating the workout.";
        return res.status(500).json({ message: errorMessage });
    }
}

    