
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { Check, Gift, Loader2, Sparkles } from "lucide-react";
import { handleLeadSubmission } from "@/ai-actions";
import PlanSignupDialog from "./PlanSignupDialog";
import type { Program } from "./CoachingProgramsSection";

const FormSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

type FormData = z.infer<typeof FormSchema>;

const tripwireProduct: Program = {
  title: 'Guía PDF "Muscle Bites"',
  price: 9, // Special offer price
  features: [
    "Más de 50 recetas altas en proteína",
    "Tips para meal prep y batch cooking",
    "Guía de suplementación básica",
    "Acceso instantáneo de por vida",
  ],
  isDigital: true,
  handle: "muscle-bites-pdf-guide"
};

type SubmissionStatus = 'idle' | 'submitting' | 'success';

export default function LeadMagnetSection() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  const triggerDownload = (url: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", url.split("/").pop() || "guia-fitness.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setStatus('submitting');
    const result = await handleLeadSubmission(data);
    
    if (result.success && result.downloadUrl) {
        setStatus('success');
        toast({
            title: "¡Guía en camino!",
            description: "Tu descarga ha comenzado. ¡Revisa la oferta especial de agradecimiento!",
        });
        
        triggerDownload(result.downloadUrl);
        form.reset();

        setTimeout(() => {
            setIsSubmitted(true);
            setStatus('idle');
        }, 1500); // Wait 1.5 seconds to show success state before showing tripwire
    } else {
        setStatus('idle');
        toast({
            variant: "destructive",
            title: "¡Uy! Algo salió mal.",
            description: result.message,
        });
    }
  };

  const getButtonContent = () => {
    switch (status) {
        case 'submitting':
            return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>;
        case 'success':
            return <><Check className="mr-2 h-4 w-4" /> ¡Descargando!</>;
        default:
            return '¡La Quiero!';
    }
  };

  return (
    <section id="lead-magnet" className="bg-secondary py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {isSubmitted ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-card-foreground shadow-lg">
                <Gift className="h-16 w-16 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight">¡Gracias! Tu guía ha sido descargada.</h2>
                <p className="text-muted-foreground max-w-md">
                    Como agradecimiento, aquí tienes una oferta única: llévate mi guía de recetas <b className="text-foreground">"Muscle Bites"</b> con un descuento exclusivo.
                </p>
                <div className="my-4 flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-primary">$9</span>
                    <span className="text-xl text-muted-foreground line-through">$29</span>
                </div>
                <PlanSignupDialog program={tripwireProduct}>
                    <Button size="lg" className="font-bold w-full sm:w-auto">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Sí, ¡Quiero la Oferta!
                    </Button>
                </PlanSignupDialog>
                <button 
                  onClick={() => setIsSubmitted(false)} 
                  className="mt-4 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    No gracias, llévame de vuelta.
                </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                Transforma tu rutina: descarga tu guía gratis
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Descarga mi guía{" "}
                <em className="font-semibold text-foreground">
                  Estrategias para lograr 10k pasos al día
                </em>{" "}
                y empieza a transformar tu rutina diaria. Ingresa tu correo para
                recibirla al instante.
              </p>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="w-full max-w-sm">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu.correo@ejemplo.com"
                            {...field}
                            className="text-center sm:text-left"
                            disabled={status !== 'idle'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={status !== 'idle'} className="w-full sm:w-auto">
                    {getButtonContent()}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
