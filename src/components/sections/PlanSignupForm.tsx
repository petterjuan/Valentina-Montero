
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handlePlanSignup } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const signupSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  phone: z.string().optional(),
  consent: z.boolean().refine(val => val === true, { message: "Debes aceptar para continuar." }),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface PlanSignupFormProps {
  plan: {
    title: string;
    price: number;
    isDigital?: boolean;
  };
  onSubmitted: () => void;
}

export default function PlanSignupForm({ plan, onSubmitted }: PlanSignupFormProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      consent: false,
    },
  });

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await handlePlanSignup({
      ...data,
      planName: plan.title,
      planPrice: plan.price,
      isDigital: plan.isDigital,
    });
    

    if (result.error) {
      setIsSubmitting(false);
      
      const isStripeError = result.error.includes("Stripe no está configurado");
      
      toast({
        variant: "destructive",
        title: "Error",
        description: isStripeError 
          ? "El sistema de pagos se está configurando. Por favor, vuelve a intentarlo más tarde."
          : result.error,
      });
    } else {
      if(result.data?.stripeCheckoutUrl){
        window.location.href = result.data.stripeCheckoutUrl;
      } else {
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: "¡Solicitud Recibida!",
            description: "Revisa tu correo para los siguientes pasos.",
        });
      }
    }
  };
  
  const dialogTitle = plan.isDigital 
    ? `Comprar ${plan.title}` 
    : "Completa tu Inscripción";

  const dialogDescription = plan.isDigital
    ? `Estás a un paso de obtener tu copia de "${plan.title}" por solo $${plan.price}.`
    : `Estás a un paso de comenzar tu transformación con el ${plan.title}.`;
    
  const buttonText = plan.isDigital
    ? "Proceder al Pago"
    : "Confirmar y Agendar";

  const consentText = plan.isDigital
    ? "Acepto los términos y ser redirigida a la pasarela de pago segura de Stripe."
    : "Entiendo que este es el primer paso y acepto ser contactada por correo electrónico o teléfono para agendar la reunión.";

  if (isSubmitted) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold font-headline">¡Todo Listo!</h3>
            <p className="text-muted-foreground">
                {plan.isDigital 
                  ? `¡Gracias por tu interés! En breve, recibirás un correo con las instrucciones para completar el pago y descargar tu PDF.`
                  : `Hemos recibido tus datos y te hemos enviado un correo de confirmación con el enlace para nuestra primera sesión. ¡Estoy muy emocionada de empezar a trabajar contigo!`
                }
            </p>
            <Button onClick={onSubmitted} className="mt-4">Cerrar</Button>
        </div>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                    <Input placeholder="Tu nombre y apellido" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="tu.correo@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            {!plan.isDigital && (
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teléfono (Opcional)</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow mt-2">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel>
                        {consentText}
                    </FormLabel>
                    <FormMessage />
                    </div>
                </FormItem>
                )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2 font-bold">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : buttonText}
            </Button>
        </form>
      </Form>
    </>
  );
}
