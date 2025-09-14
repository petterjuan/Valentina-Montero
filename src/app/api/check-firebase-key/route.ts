
import { NextResponse } from 'next/server';

// Helper function to safely parse the service account key
function parseServiceAccount(key: string) {
    try {
        // First, assume it's Base64 encoded
        const decoded = Buffer.from(key, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch (e) {
        try {
            // If Base64 decoding fails, assume it's a plain JSON string
            return JSON.parse(key);
        } catch (jsonErr) {
            // If both fail, throw a specific error
            throw new Error("La clave de servicio de Firebase no es un JSON válido ni está codificada en Base64.");
        }
    }
}

export async function GET() {
  try {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada." },
        { status: 400 }
      );
    }

    const parsed = parseServiceAccount(key);

    const requiredFields = ["type", "project_id", "private_key_id", "private_key", "client_email"];
    const missing = requiredFields.filter(field => !(field in parsed));

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "La clave de servicio está incompleta. Faltan campos requeridos.", missing },
        { status: 400 }
      );
    }

    // You can add a simple connection test here if needed in the future,
    // but for now, validating the format is a great first step.

    return NextResponse.json({ ok: true, project_id: parsed.project_id });
    
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Ocurrió un error inesperado al procesar la clave.", details: err.message },
      { status: 500 }
    );
  }
}
