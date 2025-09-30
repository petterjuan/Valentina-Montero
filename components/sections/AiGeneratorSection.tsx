
"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { generatePersonalizedWorkout, saveWorkoutLead } from "@/lib/actions";
import { type GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertTriangle, Dumbbell, Calendar, Brain, Utensils, Lock, Sparkles, Loader2, Target, Flame, Activity, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const aiGeneratorClientSchema = z.object({
  fitnessGoal: z.string().min(1, "El objetivo de fitness es requerido"),
  experienceLevel: z.string().min(1, "El nivel de experiencia es requerido"),
  equipment: z.string().min(1, "El equipo disponible es requerido"),
  workoutFocus: z.string().min(1, "El enfoque es requerido"),
  duration: z.coerce.number().min(15, "La duración debe ser al menos 15 minutos."),
  frequency: z.coerce.number().min(1, "La frecuencia debe ser al menos 1."),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal('')),
});

type AiGeneratorFormData = z.infer<typeof aiGeneratorClientSchema>;

export default function AiGeneratorSection() {
  const { toast } = useToast();
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isUnlocking, startUnlockingTransition] = useTransition();
  
  const [workoutData, setWorkoutData] = useState<GeneratePersonalizedWorkoutOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullPlan, setIsFullPlan] = useState(false);

  const form = useForm<AiGeneratorFormData>({
    resolver: zodResolver(aiGeneratorClientSchema),
    defaultValues: {
      fitnessGoal: "perder-peso",
      experienceLevel: "principiante",
      equipment: "solo-cuerpo",
      workoutFocus: "full-body",
      duration: 45,
      frequency: 3,
      email: "",
    },
  });

  const durationValue = form.watch("duration");
  const frequencyValue = form.watch("frequency");

  const handleFormSubmit = (data: AiGeneratorFormData) => {
    // Case 1: Generating the initial workout preview
    if (!workoutData) {
      startGeneratingTransition(async () => {
        setError(null);
        try {
          const newWorkout = await generatePersonalizedWorkout(data);
          setWorkoutData(newWorkout);
          
          if (data.email) {
            await saveWorkoutLead({ email: data.email });
            setIsFullPlan(true); // Unlock directly if email was provided initially
          }

        } catch (e: any) {
          const errorMessage = e.message || 'Ocurrió un error al generar tu plan.';
          toast({ variant: "destructive", title: "Error", description: errorMessage });
          setError(errorMessage);
        }
      });
      return;
    }

    // Case 2: Unlocking the full plan with an email
    if (workoutData && !isFullPlan && data.email) {
      const emailToSave = data.email;
      if (typeof emailToSave !== 'string' || emailToSave === '') {
        return;
      }
      
      startUnlockingTransition(async () => {
        setError(null);
        try {
          const leadResult = await saveWorkoutLead({ email: emailToSave });
          if (leadResult.success) {
            setIsFullPlan(true);
            toast({ title: "¡Plan Desbloqueado!", description: "Gracias por suscribirte. Ahora tienes acceso al plan completo." });
          } else {
            throw new Error(leadResult.error || "No se pudo guardar tu correo.");
          }
        } catch (e: any) {
            const errorMessage = e.message || "Ocurrió un error al desbloquear tu plan.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
            setError(errorMessage);
        }
      });
    }
  };
  
  const firstDay = workoutData?.fullWeekWorkout[0];
  const isLoading = isGenerating || isUnlocking;

  return (
    <section id="ai-generator" className="py-16 sm:py-24 bg-background">
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
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="space-y-6"
                >
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <FormField
                      control={form.control}
                      name="workoutFocus"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Enfoque Principal</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un enfoque" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-body">Cuerpo Completo (Full Body)</SelectItem>
                              <SelectItem value="tren-superior">Tren Superior</SelectItem>
                              <SelectItem value="tren-inferior">Tren Inferior</SelectItem>
                              <SelectItem value="cardio-resistencia">Cardio y Resistencia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  min={15}
                                  max={90}
                                  step={5}
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
                                    value={[field.value]}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                    min={1}
                                    max={7}
                                    step={1}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                       )}
                      />
                  </div>
                  
                  {!workoutData && (
                    <Button type="submit" disabled={isGenerating} className="w-full font-bold">
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isGenerating ? "Generando Vista Previa..." : "Generar Mi Plan (Vista Previa)"}
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {isGenerating && !workoutData && (
             <Card className="mt-8">
                <CardContent className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Creando tu plan personalizado...</p>
                </CardContent>
            </Card>
          )}

          {error && !isLoading && (
            <Card className="mt-8 border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {workoutData && !isFullPlan && !isLoading && (
            <div className="mt-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 font-headline">
                            <Target className="h-6 w-6 text-primary" />
                            Vista Previa: Tu Primer Día
                        </CardTitle>
                        <CardDescription>{workoutData.overview}</CardDescription>
                    </CardHeader>
                    {firstDay && (
                        <CardContent>
                            <Accordion type="single" collapsible defaultValue={firstDay.day} className="w-full">
                                <AccordionItem value={firstDay.day}>
                                <AccordionTrigger className="font-bold text-lg hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</span>
                                        {firstDay.day}: <span className="text-muted-foreground font-medium">{firstDay.focus}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4 border-l-2 border-primary ml-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Flame className="h-5 w-5 text-amber-500" />Calentamiento</h4>
                                            <p className="text-muted-foreground text-sm pl-7">{firstDay.warmup}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />Entrenamiento</h4>
                                            <ul className="space-y-2 mt-2 pl-7">
                                                {firstDay.exercises.map((ex, i) => (
                                                    <li key={i} className="flex justify-between items-center text-sm">
                                                        <span>{ex.name}</span>
                                                        <span className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">{ex.sets} x {ex.reps}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-green-500" />Enfriamiento</h4>
                                            <p className="text-muted-foreground text-sm pl-7">{firstDay.cooldown}</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    )}
                </Card>
                
                <Card className="bg-secondary border-primary border-dashed">
                    <CardHeader className="text-center items-center">
                        <Lock className="h-10 w-10 text-primary mb-2" />
                        <CardTitle className="font-headline text-2xl">¡Tu Plan Semanal Completo está Listo!</CardTitle>
                        <CardDescription className="max-w-prose">
                            Introduce tu correo para desbloquear la rutina completa, junto con consejos exclusivos de nutrición y mentalidad para maximizar tus resultados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                            <li className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
                                <Calendar className="h-6 w-6 text-primary"/>
                                <span className="font-semibold">{workoutData.fullWeekWorkout.length - 1} Días Adicionales</span>
                            </li>
                            <li className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
                                <Utensils className="h-6 w-6 text-primary"/>
                                <span className="font-semibold">Tips de Nutrición</span>
                            </li>
                             <li className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
                                <Brain className="h-6 w-6 text-primary"/>
                                <span className="font-semibold">Tips de Mentalidad</span>
                            </li>
                        </ul>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormControl>
                                        <Input placeholder="tu.correo@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isUnlocking} className="font-bold w-full sm:w-auto flex-shrink-0">
                                    {isUnlocking 
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Desbloqueando...</>
                                        : <><Sparkles className="mr-2 h-4 w-4" />Desbloquear Plan</>
                                    }
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
          )}


          {workoutData && isFullPlan && !isLoading && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline">
                  <Target className="h-6 w-6 text-primary" />
                  Tu Plan de Entrenamiento Completo
                </CardTitle>
                <CardDescription>{workoutData.overview}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={[workoutData.fullWeekWorkout[0]?.day]} className="w-full">
                  {workoutData.fullWeekWorkout?.map((day, index) => (
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

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-headline text-xl mb-3 flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-primary"/>
                            Consejos de Nutrición
                        </h3>
                        <ul className="space-y-2">
                            {workoutData.nutritionTips?.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                    <span className="text-muted-foreground">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-headline text-xl mb-3 flex items-center gap-2">
                           <Brain className="h-5 w-5 text-primary"/>
                            Consejos de Mentalidad
                        </h3>
                        <ul className="space-y-2">
                            {workoutData.mindsetTips?.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                    <span className="text-muted-foreground">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

