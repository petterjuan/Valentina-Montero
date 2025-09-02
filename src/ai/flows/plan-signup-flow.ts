'use server';

/**
 * @fileOverview Flujo para manejar la inscripción de nuevos clientes a planes de coaching.
 * - processPlanSignup: Procesa la solicitud, guarda en Firestore, y (simula) enviar correos.
 * - PlanSignupInput: El tipo de entrada para el flujo.
 * - PlanSignupOutput: El tipo de retorno para el flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestore } from '@/lib/firebase';

const PlanSignupInputSchema = z.object({
  fullName: z.string().describe('Nombre completo del cliente.'),
  email: z.string().email().describe('Correo electrónico del cliente.'),
  phone: z.string().optional().describe('Número de teléfono del cliente (opcional).'),
  planName: z.string().describe('El nombre del plan de coaching seleccionado.'),
  planPrice: z.number().describe('El precio del plan seleccionado.'),
});
export type PlanSignupInput = z.infer<typeof PlanSignupInputSchema>;

const PlanSignupOutputSchema = z.object({
  confirmationMessage: z.string(),
  meetLink: z.string(),
  clientEmail: z.string(),
  planName: z.string(),
});
export type PlanSignupOutput = z.infer<typeof PlanSignupOutputSchema>;

export async function processPlanSignup(input: PlanSignupInput): Promise<PlanSignupOutput> {
  return planSignupFlow(input);
}

// TODO: Configurar autenticación de Google y activar la API de Google Calendar.
// const createGoogleMeetLink = ai.defineTool(
//   {
//     name: 'createGoogleMeetLink',
//     description: 'Crea un nuevo evento en Google Calendar con un enlace de Google Meet y devuelve el enlace.',
//     inputSchema: z.object({
//       summary: z.string().describe('El título del evento.'),
//       description: z.string().describe('La descripción del evento.'),
//       attendeeEmail: z.string().email().describe('El correo del invitado.'),
//       startTime: z.string().datetime().describe('La hora de inicio en formato ISO 8601.'),
//       endTime: z.string().datetime().describe('La hora de fin en formato ISO 8601.'),
//     }),
//     outputSchema: z.string().url().describe('El enlace a la reunión de Google Meet.'),
//   },
//   async (input) => {
//     // Lógica para llamar a la API de Google Calendar
//     // Por ahora, devolvemos un enlace de placeholder.
//     return 'https://meet.google.com/placeholder-link';
//   }
// );

// TODO: Configurar un servicio de envío de correos (ej. SendGrid, Mailgun)
// const sendConfirmationEmail = ai.defineTool(
//   {
//     name: 'sendConfirmationEmail',
//     description: 'Envía un correo de confirmación al cliente y una notificación al administrador.',
//     inputSchema: z.object({
//       to: z.string().email(),
//       subject: z.string(),
//       body: z.string(),
//     }),
//     outputSchema: z.object({ success: z.boolean() }),
//   },
//   async ({ to, subject, body }) => {
//     // Lógica para enviar el correo
//     console.log(`Simulando envío de correo a ${to}`);
//     console.log(`Asunto: ${subject}`);
//     console.log(`Cuerpo: ${body}`);
//     return { success: true };
//   }
// );

const planSignupFlow = ai.defineFlow(
  {
    name: 'planSignupFlow',
    inputSchema: PlanSignupInputSchema,
    outputSchema: PlanSignupOutputSchema,
    // tools: [createGoogleMeetLink, sendConfirmationEmail],
  },
  async (input) => {
    // 1. Generar (simular) enlace de Google Meet
    const meetLink = "https://meet.google.com/placeholder-for-" + input.email.split('@')[0];

    // 2. Guardar en Firestore
    const registrationDate = new Date();
    await firestore.collection('signups').add({
      ...input,
      meetLink,
      registrationDate,
    });

    // 3. Generar (simular) correos de confirmación
    const confirmationMessageForClient = `¡Hola ${input.fullName}! Gracias por unirte al ${input.planName}. Estoy muy emocionada de empezar este viaje contigo. Nuestra primera sesión será a través de este enlace: ${meetLink}. Pronto me pondré en contacto para coordinar el horario. ¡Prepárate para transformar tu vida!`;
    const notificationForAdmin = `Nueva inscripción: ${input.fullName} (${input.email}) se ha inscrito en el ${input.planName}. Enlace de Meet generado: ${meetLink}`;

    // await sendConfirmationEmail({
    //   to: input.email,
    //   subject: '¡Bienvenida a VM Fitness Hub!',
    //   body: confirmationMessageForClient,
    // });

    // await sendConfirmationEmail({
    //   to: 'valentina.montero@example.com', // Email del administrador
    //   subject: `Nueva Inscripción: ${input.planName}`,
    //   body: notificationForAdmin,
    // });
    
    console.log("Notificación para Valentina:", notificationForAdmin);


    return {
      confirmationMessage: '¡Inscripción completada! Revisa tu correo para ver los detalles y el enlace a nuestra primera reunión.',
      meetLink,
      clientEmail: input.email,
      planName: input.planName,
    };
  }
);
