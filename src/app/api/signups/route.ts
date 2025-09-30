
import { processPlanSignup, PlanSignupInput } from '@/ai/flows/plan-signup-flow';
import { logEvent } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlanSignupInput;
    const result = await processPlanSignup(body);
    return NextResponse.json(result);
  } catch (error: any) {
    const errorMessage = error.message || "No se pudo procesar la solicitud.";
    logEvent('Plan Signup API Failed', { error: errorMessage }, 'error');
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

    