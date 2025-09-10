
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
import { CheckCircle } from "lucide-react";
import { handleLeadSubmission } from "@/app/actions";

const FormSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

type FormData = z.infer<typeof FormSchema>;

export default function LeadMagnetSection() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const result = await handleLeadSubmission(data);
    
    if (result.success) {
      setIsSubmitted(true);
      toast({
        title: "¡Éxito!",
        description: "Tu guía está en camino a tu bandeja de entrada.",
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "¡Uy! Algo salió mal.",
        description: result.message,
      });
    }
  };

  return (
    <section className="bg-secondary py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          {isSubmitted ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-card-foreground">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-3xl font-bold tracking-tight">¡Gracias!</h2>
                <p className="text-muted-foreground">
                    Tu guía está en camino. Revisa tu bandeja de entrada y prepárate para transformar tu rutina.
                </p>
                <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-4">
                    Suscribir otro correo
                </Button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                Consigue tu Guía Gratuita
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                    {form.formState.isSubmitting ? "Enviando..." : "¡La Quiero!"}
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
