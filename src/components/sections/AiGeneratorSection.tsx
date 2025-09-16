
"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { handleAiGeneration, type AiGeneratorFormState } from "@/app/actions";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertTriangle, Dumbbell, Zap, Calendar, Clock, CheckCircle, Flame, Shield, Activity, Target, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string({ required_error: "Por favor, selecciona una meta." }),
  experienceLevel: z.string({ required_error: "Por favor, selecciona tu nivel." }),
  equipment: z.string({ required_error: "Por favor, selecciona tu equipo." }),
  duration: z.number(),
  frequency: z.number(),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal('')),
});

type AiGeneratorFormData = z.infer<typeof aiGeneratorSchema>;

export default function AiGeneratorSection() {
  const [state, setState] = useState<AiGeneratorFormState>({});
  const { toast } = useToast();

  const form = useForm<AiGeneratorFormData>({
    resolver: zodResolver(aiGeneratorSchema),
    defaultValues: {
      fitnessGoal: "perder-peso",
      experienceLevel: "principiante",
      equipment: "solo-cuerpo",
      duration: 45,
      frequency: 3,
      email: "",
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
  }, [state.error, toast]);
  
  const onSubmit = async (data: AiGeneratorFormData) => {
    setState({}); // Clear previous results
    const result = await handleAiGeneration(data);
    setState(result);

    if(result.data) {
        let toastDescription = "Tu rutina personalizada te espera más abajo.";
        if (data.email) {
            toastDescription += " También te la hemos enviado a tu correo.";
        }
        toast({
            title: "¡Plan Generado!",
            description: toastDescription,
        });
    }
  };


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
        <div className="mt-12 max-w-4xl mx-auto">
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fitnessGoal"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Meta Fitness</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                           <Label>Nivel de Experiencia</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                          <Label>Equipo Disponible</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Selecciona tu equipo" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               <SelectItem value="solo-cuerpo">Solo Peso Corporal</SelectItem>
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
                                <Label className="flex justify-between">
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
                                <Label className="flex justify-between">
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
                  
                  <Separator />
                  
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email (Opcional)
                          </Label>
                           <p className="text-sm text-muted-foreground -mt-2 mb-2">
                             Guarda una copia de este plan en tu correo y recibe consejos exclusivos.
                           </p>
                          <FormControl>
                            <Input placeholder="tu.correo@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full font-bold">
                    <Wand2 className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Generando..." : "Generar Mi Plan"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {state.error && !state.data && (
            <Card className="mt-8 border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{state.error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {state.data && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline">
                  <Target className="h-6 w-6 text-primary" />
                  Tu Plan de Entrenamiento Personalizado
                </CardTitle>
                <CardDescription>{state.data.overview}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="Día 1" className="w-full">
                  {state.data.weeklySchedule?.map((day, index) => (
                    <AccordionItem value={day.day} key={index}>
                      <AccordionTrigger className="font-bold text-lg hover:no-underline">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{index + 1}</span>
                            {day.day}: <span className="text-muted-foreground font-medium">{day.focus}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-4 border-l-2 border-primary ml-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><Flame className="h-5 w-5 text-amber-500" />Calentamiento</h4>
                                <p className="text-muted-foreground text-sm pl-7">{day.warmup}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />Entrenamiento</h4>
                                <ul className="space-y-2 mt-2 pl-7">
                                    {day.exercises.map((ex, i) => (
                                        <li key={i} className="flex justify-between items-center text-sm">
                                            <span>{ex.name}</span>
                                            <span className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">{ex.sets} x {ex.reps}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-green-500" />Enfriamiento</h4>
                                <p className="text-muted-foreground text-sm pl-7">{day.cooldown}</p>
                            </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <Separator className="my-6" />

                <h3 className="font-headline text-xl mb-3">Recomendaciones Adicionales</h3>
                <ul className="space-y-2">
                    {state.data.recommendations?.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                            <span className="text-muted-foreground">{rec}</span>
                        </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

    