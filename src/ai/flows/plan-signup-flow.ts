"use server";

/**
 * @fileOverview Flujo para manejar la inscripción de nuevos clientes a planes de coaching y la compra de productos digitales.
 * - processPlanSignup: Procesa la solicitud, guarda en Firestore, y (simula) el flujo de pago y envío.
 * - PlanSignupInput: El tipo de entrada para el flujo.
 * - PlanSignupOutput: El tipo de retorno para el flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from '@/lib/firebase';

const PlanSignupInputSchema = z.object({
  fullName: z.string().describe('Nombre completo del cliente.'),
  email: z.string().email().describe('Correo electrónico del cliente.'),
  phone: z.string().optional().describe('Número de teléfono del cliente (opcional).'),
  planName: z.string().describe('El nombre del plan o producto seleccionado.'),
  planPrice: z.number().describe('El precio del plan o producto.'),
  isDigital: z.boolean().optional().describe('Indica si es un producto digital.'),
});
export type PlanSignupInput = z.infer<typeof PlanSignupInputSchema>;

const PlanSignupOutputSchema = z.object({
  confirmationMessage: z.string(),
  meetLink: z.string().optional(),
  clientEmail: z.string(),
  planName: z.string(),
});
export type PlanSignupOutput = z.infer<typeof PlanSignupOutputSchema>;

export async function processPlanSignup(input: PlanSignupInput): Promise<PlanSignupOutput> {
  return planSignupFlow(input);
}

const planSignupFlow = ai.defineFlow(
  {
    name: 'planSignupFlow',
    inputSchema: PlanSignupInputSchema,
    outputSchema: PlanSignupOutputSchema,
  },
  async (input) => {
    const firestore = getFirestore();
    if (!firestore) {
        throw new Error("Firestore no está inicializado. Verifica las credenciales de Firebase.");
    }
    
    const registrationDate = new Date();

    if (input.isDigital) {
      // Flujo para producto digital (ej. PDF "Muscle Bites")
      // 1. Guardar pre-lead en Firestore
      await firestore.collection('leads').add({
        email: input.email,
        fullName: input.fullName,
        productName: input.planName,
        status: 'initiated',
        createdAt: registrationDate,
      });

      // TODO: Implementar la creación de la sesión de Stripe Checkout.
      // const stripeSession = await createStripeCheckoutSession(input.email, input.planPrice, input.planName);
      // Por ahora, simulamos que el pago se iniciará.

      console.log(`Simulando inicio de pago para ${input.email} por el producto ${input.planName}.`);
      
      return {
        confirmationMessage: '¡Gracias! Serás redirigido para completar el pago. Revisa tu correo después de la compra.',
        clientEmail: input.email,
        planName: input.planName,
      };

    } else {
      // Flujo para planes de coaching
      // 1. Generar (simular) enlace de Google Meet
      const meetLink = "https://meet.google.com/placeholder-for-" + input.email.split('@')[0];
      
      // 2. Guardar en Firestore
      await firestore.collection('signups').add({
        ...input,
        meetLink,
        registrationDate,
      });

      // 3. Generar (simular) correos de confirmación
      const notificationForAdmin = `Nueva inscripción: ${input.fullName} (${input.email}) se ha inscrito en el ${input.planName}. Enlace de Meet generado: ${meetLink}`;
      console.log("Notificación para Valentina:", notificationForAdmin);

      return {
        confirmationMessage: '¡Inscripción completada! Revisa tu correo para ver los detalles y el enlace a nuestra primera reunión.',
        meetLink,
        clientEmail: input.email,
        planName: input.planName,
      };
    }
  }
);
