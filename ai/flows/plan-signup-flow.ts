
"use server";

/**
 * @fileOverview Flujo para manejar la inscripción de nuevos clientes a planes de coaching y la compra de productos digitales.
 * - processPlanSignup: Procesa la solicitud, guarda en Firestore, y (simula) el flujo de pago y envío.
 * - PlanSignupInput: El tipo de entrada para el flujo.
 * - PlanSignupOutput: El tipo de retorno para el flujo.
 */

import { defineFlow, run } from 'genkit';
import { z } from 'zod';
import { getFirestore } from '@/lib/firebase';
import { stripe } from '@/lib/stripe';
import { logEvent } from '@/lib/logger';

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
  return await run(planSignupFlow, input);
}

const planSignupFlow = defineFlow(
  {
    name: 'planSignupFlow',
    inputSchema: PlanSignupInputSchema,
    outputSchema: PlanSignupOutputSchema,
  },
  async (input) => {
    const registrationDate = new Date();

    if (input.isDigital) {
      // Flujo para producto digital (ej. PDF "Muscle Bites")
      const firestore = getFirestore();
      if(firestore) {
          try {
            const leadRef = firestore.collection('leads').doc();
            await leadRef.set({
              email: input.email,
              fullName: input.fullName,
              productName: input.planName,
              status: 'initiated',
              createdAt: registrationDate,
            });
          } catch (e) {
            logEvent('Firestore Write Error', { message: 'Failed to create lead during digital purchase', error: e instanceof Error ? e.message : String(e) }, 'warn');
          }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        logEvent('Stripe Payment Error', { error: 'NEXT_PUBLIC_APP_URL is not set in environment variables' }, 'error');
        throw new Error('Server configuration error: NEXT_PUBLIC_APP_URL is not defined.');
      }
      
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
        success_url: `${appUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?payment_cancelled=true`,
        customer: customer.id,
      });
      
      if (!checkoutSession.url) {
        logEvent('Stripe Checkout Error', { message: 'Stripe failed to return a checkout URL.', input: input }, 'error');
        throw new Error('Could not create Stripe Checkout session.');
      }

      return {
        confirmationMessage: '¡Gracias! Serás redirigido para completar el pago.',
        clientEmail: input.email,
        planName: input.planName,
        stripeCheckoutUrl: checkoutSession.url,
      };

    } else {
      // Flujo para planes de coaching
      const firestore = getFirestore();

      // 1. Generar (simular) enlace de Google Meet
      const meetLink = "https://meet.google.com/placeholder-for-" + input.email.split('@')[0];
      
      // 2. Guardar en Firestore (si está disponible)
      if (firestore) {
        await firestore.collection('signups').add({
          ...input,
          meetLink,
          registrationDate,
        });
      }
      
      return {
        confirmationMessage: '¡Inscripción completada! Revisa tu correo para ver los detalles y el enlace a nuestra primera reunión.',
        meetLink,
        clientEmail: input.email,
        planName: input.planName,
      };
    }
  }
);
