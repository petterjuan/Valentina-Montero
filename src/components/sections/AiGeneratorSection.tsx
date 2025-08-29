"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { handleAiGeneration } from "@/app/actions";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertTriangle, Dumbbell, Zap, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string().default("perder-peso"),
  experienceLevel: z.string().default("principiante"),
  equipment: z.string().default("solo-cuerpo"),
  duration: z.number().default(45),
  frequency: z.number().default(3),
});

type AiGeneratorFormData = z.infer<typeof aiGeneratorSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full font-bold">
      <Wand2 className="mr-2 h-4 w-4" />
      {pending ? "Generando..." : "Generar Mi Plan"}
    </Button>
  );
}

export default function AiGeneratorSection() {
  const initialState = { error: "", data: "" };
  const [state, formAction] = useActionState(handleAiGeneration, initialState);
  const { toast } = useToast();

  const form = useForm<AiGeneratorFormData>({
    resolver: zodResolver(aiGeneratorSchema),
    defaultValues: {
      fitnessGoal: "perder-peso",
      experienceLevel: "principiante",
      equipment: "solo-cuerpo",
      duration: 45,
      frequency: 3,
    },
  });

  const durationValue = form.watch("duration");
  const frequencyValue = form.watch("frequency");

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
    if (state.data) {
      toast({
        title: "¡Éxito!",
        description: "Tu plan de entrenamiento se ha generado a continuación.",
      });
      form.reset();
    }
  }, [state, toast, form]);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            Crea tu Plan de Entrenamiento Perfecto
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Responde unas sencillas preguntas y te mostraré una rutina de entrenamiento personalizada y adaptada a tus objetivos, experiencia y equipo disponible. ¿Lista para un plan más detallado y seguimiento personalizado? Mis sesiones 1 a 1 están diseñadas para llevarte al siguiente nivel.
          </p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-primary" />
                Preferencias de Entrenamiento
              </CardTitle>
              <CardDescription>
                Cuéntanos sobre ti para obtener un plan personalizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form action={formAction} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fitnessGoal"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="fitnessGoal">Meta Fitness</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger id="fitnessGoal">
                                <SelectValue placeholder="Selecciona una meta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="perder-peso">Perder Peso</SelectItem>
                              <SelectItem value="ganar-musculo">Ganar Músculo</SelectItem>
                              <SelectItem value="mejorar-resistencia">Mejorar Resistencia</SelectItem>
                              <SelectItem value="mantenerse-activo">Mantenerse Activo/a</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                           <Label htmlFor="experienceLevel">Nivel de Experiencia</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger id="experienceLevel">
                                  <SelectValue placeholder="Selecciona tu nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="principiante">Principiante</SelectItem>
                                <SelectItem value="intermedio">Intermedio</SelectItem>
                                <SelectItem value="avanzado">Avanzado</SelectItem>
                              </SelectContent>
                           </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                   <FormField
                      control={form.control}
                      name="equipment"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="equipment">Equipo Disponible</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                               <SelectTrigger id="equipment">
                                 <SelectValue placeholder="Selecciona tu equipo" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               <SelectItem value="solo-cuerpo">Solo Peso Corporal (Bodyweight only)</SelectItem>
                               <SelectItem value="basico">Básico (Mancuernas, bandas)</SelectItem>
                               <SelectItem value="gimnasio">Gimnasio Completo</SelectItem>
                             </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="duration" className="flex justify-between">
                                    <span>Duración (minutos)</span>
                                    <span className="text-primary font-bold">{durationValue} min</span>
                                </Label>
                                <FormControl>
                                    <Slider 
                                        name={field.name}
                                        defaultValue={[field.value]} 
                                        min={15} 
                                        max={90} 
                                        step={5} 
                                        onValueChange={(vals) => field.onChange(vals[0])}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="frequency" className="flex justify-between">
                                    <span>Frecuencia (por semana)</span>
                                    <span className="text-primary font-bold">{frequencyValue} veces</span>
                                </Label>
                                <FormControl>
                                    <Slider 
                                        name={field.name}
                                        defaultValue={[field.value]} 
                                        min={1} 
                                        max={7} 
                                        step={1}
                                        onValueChange={(vals) => field.onChange(vals[0])}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>

                  <SubmitButton />
                </form>
              </Form>
            </CardContent>
          </Card>

          {state.error && (
            <Card className="mt-6 border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{state.error}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {state.data && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wand2 className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">Tu Plan de Entrenamiento Personalizado</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Zap className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold">Experiencia</p>
                            <p className="text-muted-foreground">{state.inputs?.experienceLevel}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold">Duración</p>
                            <p className="text-muted-foreground">{state.inputs?.duration} min</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold">Frecuencia</p>
                            <p className="text-muted-foreground">{state.inputs?.frequency}/semana</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold">Equipo</p>
                            <p className="text-muted-foreground">{state.inputs?.equipment}</p>
                        </div>
                    </div>
                </div>

                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{state.data}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
