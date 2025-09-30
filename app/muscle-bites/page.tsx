
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from 'components/ui/button';
import { Flame, Star, Zap, Clock, Shield } from 'lucide-react';
import placeholderImages from 'lib/placeholder-images.json';
import PlanSignupDialog from 'components/sections/PlanSignupDialog';
import type { Program } from 'types';

const productOffer: Program = {
  title: 'Guía PDF "Muscle Bites"',
  price: 29,
  features: [
    'Más de 50 recetas altas en proteína',
    'Tips para meal prep y batch cooking',
    'Guía de suplementación básica',
    'Acceso instantáneo de por vida',
  ],
  isDigital: true,
  handle: 'muscle-bites-pdf-guide',
};

const features = [
  { icon: Flame, text: '+50 Recetas Altas en Proteína' },
  { icon: Zap, text: 'Dispara tu Energía y Rendimiento' },
  { icon: Clock, text: 'Comidas Listas en Menos de 20 Minutos' },
  { icon: Shield, text: 'Optimiza la Recuperación Muscular' },
];

export default function MuscleBitesPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section id="hero-offer" className="relative py-20 md:py-32 text-center">
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight uppercase text-foreground drop-shadow-lg">
              Recetas Fáciles, Resultados Visibles
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground drop-shadow-md">
              Desbloquea el poder de la nutrición con "Muscle Bites", tu guía definitiva de recetas altas en proteína que son tan deliciosas como efectivas.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <PlanSignupDialog program={productOffer}>
                  <Button size="lg" className="font-bold text-lg h-14 px-10">
                    Comprar Mi Guía Ahora 💪
                  </Button>
              </PlanSignupDialog>
              <p className="text-sm text-muted-foreground h-8">Pago seguro con Stripe. Acceso instantáneo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={placeholderImages.programs.fallback3.src}
                alt="Platillos de Muscle Bites"
                fill
                className="object-cover"
                data-ai-hint="healthy food protein"
              />
            </div>
            
            {/* Content */}
            <div>
              <h2 className="text-3xl font-bold font-headline mb-6">Transforma Tu Cuerpo Desde la Cocina</h2>
              <p className="text-muted-foreground mb-6">
                "Muscle Bites" no es solo un libro de recetas; es tu arma secreta para construir el cuerpo que deseas sin sacrificar el sabor ni pasar horas en la cocina. Cada receta está diseñada para ser deliciosa, fácil de preparar y, lo más importante, cargada de la proteína que necesitas para tus músculos.
              </p>
              
              <div className="space-y-4 mb-8">
                {features.map(feature => (
                  <div key={feature.text} className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-2">
                       <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-card border rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Acceso Inmediato a "Muscle Bites"</h3>
                    <p className="text-sm text-muted-foreground">Tu guía completa para una nutrición de resultados.</p>
                  </div>
                  <p className="text-4xl font-bold font-code">${productOffer.price}</p>
                </div>
                <PlanSignupDialog program={productOffer}>
                    <Button size="lg" className="w-full mt-4 font-bold">
                        ¡Quiero Mi Guía Ahora!
                    </Button>
                </PlanSignupDialog>
              </div>

            </div>
          </div>

           {/* Testimonial */}
          <div className="max-w-3xl mx-auto text-center mt-20">
            <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />)}
            </div>
            <blockquote className="text-xl italic text-foreground">
                "¡Estas recetas son increíbles! Por fin estoy viendo los resultados que quería y la comida es deliciosa. ¡Totalmente recomendado!"
            </blockquote>
            <p className="mt-4 font-semibold">- Ana P., Clienta Satisfecha</p>
          </div>
        </div>
      </main>
    </div>
  );
}
