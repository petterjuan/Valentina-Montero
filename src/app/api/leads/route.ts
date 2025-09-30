
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase';
import { z } from 'zod';
import { logEvent } from '@/lib/logger';

const LeadSchema = z.object({
  email: z.string().email(),
  source: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = LeadSchema.parse(body);

    const firestore = getFirestore();
    if (!firestore) {
      throw new Error("Firestore no está disponible.");
    }

    const leadRef = firestore.collection('leads').doc(email);
    await leadRef.set({
      email,
      source,
      status: 'subscribed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'Lead guardado correctamente.' });
  } catch (error) {
    let errorMessage = "Ocurrió un error desconocido.";
    if (error instanceof z.ZodError) {
      errorMessage = "Datos de entrada inválidos.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    logEvent('Save Lead API Failed', { error: errorMessage }, 'error');
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

    