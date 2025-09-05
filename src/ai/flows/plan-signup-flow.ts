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
import { getStripe } from '@/lib/stripe';

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
  stripeCheckoutUrl: z.string().optional(),
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
      const stripe = getStripe();
      const leadRef = firestore.collection('leads').doc();

      await leadRef.set({
        email: input.email,
        fullName: input.fullName,
        productName: input.planName,
        status: 'initiated',
        createdAt: registrationDate,
      });

      const customer = await stripe.customers.create({
        email: input.email,
        name: input.fullName,
      });

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: input.planName,
                description: 'Acceso instantáneo a recetas y tips de nutrición.',
              },
              unit_amount: input.planPrice * 100, // Precio en centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}?payment_cancelled=true`,
        customer: customer.id,
        metadata: {
            leadId: leadRef.id,
        }
      });
      
      return {
        confirmationMessage: '¡Gracias! Serás redirigido para completar el pago.',
        clientEmail: input.email,
        planName: input.planName,
        stripeCheckoutUrl: checkoutSession.url!,
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
