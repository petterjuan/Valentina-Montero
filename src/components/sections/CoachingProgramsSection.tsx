"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, FileText } from "lucide-react";
import PlanSignupForm from "@/components/sections/PlanSignupForm";

const programs = [
  {
    title: "Plan de Coaching de 6 Semanas",
    price: 167,
    features: [
      "Plan de entrenamiento personalizado",
      "Seguimiento de progreso quincenal",
      "Guía de nutrición y macros",
      "Soporte 24/7 para preguntas",
      "Enfoque en mentalidad y motivación",
    ],
  },
  {
    title: "Plan de Coaching de 12 Semanas",
    price: 267,
    isPopular: true,
    features: [
      "Todo lo del plan de 6 semanas",
      "+ Mini Guía de Suplementos y Vitaminas",
      "Seguimiento avanzado del progreso",
      "Sugerencias de comidas personalizadas",
      "Sesión de estrategia al final del plan",
    ],
  },
  {
    title: 'PDF "Muscle Bites"',
    price: 25,
    isPopular: false,
    isDigital: true,
    features: [
        "4 Tips para Combinar Snacks en el día",
        "10 Recetas (Pre-Entrenamiento)",
        "5 Recetas (Post-Entrenamiento)",
    ],
    shopifyLink: "#",
  },
];

type Program = (typeof programs)[0];

export default function CoachingProgramsSection() {
  const [selectedPlan, setSelectedPlan] = useState<Program | null>(null);

  const openDialog = (program: Program) => {
    if (!program.isDigital) {
      setSelectedPlan(program);
    }
  };

  const closeDialog = () => {
    setSelectedPlan(null);
  };

  return (
    <>
      <section id="programs" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              ¿Lista para Comprometerte?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Elige el plan que mejor se adapte a tus metas. Empecemos este
              viaje juntas.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
            {programs.map((program) => (
              <Card
                key={program.title}
                className={`flex flex-col ${
                  program.isPopular ? "border-primary shadow-lg" : ""
                }`}
              >
                <CardHeader className="items-center pb-4">
                  {program.isPopular && (
                    <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      MÁS POPULAR
                    </div>
                  )}
                  <CardTitle className="text-2xl font-headline text-center">{program.title}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">${program.price}</span>
                    {!program.isDigital && <span className="text-sm font-semibold text-muted-foreground">/ plan</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {program.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {program.isDigital ? (
                          <FileText className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Check className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                        )}
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {program.isDigital ? (
                     <Button asChild className="w-full font-bold">
                        <a href={program.shopifyLink}>Comprar PDF</a>
                     </Button>
                  ) : (
                    <Button onClick={() => openDialog(program)} className="w-full font-bold">
                        Elegir Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedPlan} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedPlan && <PlanSignupForm plan={selectedPlan} onSubmitted={closeDialog} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
