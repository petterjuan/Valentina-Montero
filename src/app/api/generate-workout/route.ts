
import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput } from '@/ai/flows/generate-personalized-workout';
import { logEvent } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GeneratePersonalizedWorkoutInput;
    const workoutData = await generatePersonalizedWorkout(body);
    return NextResponse.json(workoutData);
  } catch (error: any) {
    const errorMessage = error.message || 'Ocurrió un error al generar tu plan.';
    logEvent('AI Workout Generation API Failed', { error: errorMessage }, 'error');
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

    