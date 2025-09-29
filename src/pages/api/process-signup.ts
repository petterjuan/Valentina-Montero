
import { NextApiRequest, NextApiResponse } from 'next';
import { processPlanSignup, PlanSignupInput } from '@/ai/flows/plan-signup-flow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const input: PlanSignupInput = req.body;
        
        if (!input.fullName || !input.email || !input.planName) {
             return res.status(400).json({ message: 'Missing required signup parameters.' });
        }

        const result = await processPlanSignup(input);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Error in /api/process-signup:", error);
        const errorMessage = error.message || "An unexpected error occurred during signup.";
        return res.status(500).json({ message: errorMessage });
    }
}
