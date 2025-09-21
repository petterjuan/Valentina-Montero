'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Flame, Star, Zap, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import optimizationCopy from '@/lib/optimization-copy.json';
import placeholderImages from '@/lib/placeholder-images.json';
import PlanSignupDialog from '@/components/sections/PlanSignupDialog';
import type { Program } from '@/components/sections/CoachingProgramsSection';
import { logConversion } from '@/app/actions';

const productOffer: Program = {
  title: 'Guía PDF "Muscle Bites"',
  price: 25,
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

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function MuscleBitesPage() {
  const [copy, setCopy] = useState(optimizationCopy.hero);
  const [microcopy, setMicrocopy] = useState(optimizationCopy.microcopy[0]);
  const [stickyText, setStickyText] = useState(optimizationCopy.stickyCTA[0].text);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [activeMicrocopyId, setActiveMicrocopyId] = useState(optimizationCopy.microcopy[0].id);
  const [hasLoggedConversion, setHasLoggedConversion] = useState(false);


  useEffect(() => {
    // --- Client-side only logic ---
    
    // A/B Test Microcopy (persists for the session)
    let storedVariation = sessionStorage.getItem('microcopyVariation');
    if (!storedVariation) {
      const randomIndex = Math.floor(Math.random() * optimizationCopy.microcopy.length);
      storedVariation = optimizationCopy.microcopy[randomIndex].id;
      sessionStorage.setItem('microcopyVariation', storedVariation);
    }
    const activeVariation = optimizationCopy.microcopy.find(m => m.id === storedVariation) || optimizationCopy.microcopy[0];
    setMicrocopy(activeVariation);
    setActiveMicrocopyId(activeVariation.id);
    
    // A/B Test Sticky CTA
    let stickyVariation = sessionStorage.getItem('stickyCtaVariation');
    if(!stickyVariation) {
        const randomIndex = Math.floor(Math.random() * optimizationCopy.stickyCTA.length);
        stickyVariation = optimizationCopy.stickyCTA[randomIndex].id;
        sessionStorage.setItem('stickyCtaVariation', stickyVariation);
    }
    const activeStickyVariation = optimizationCopy.stickyCTA.find(s => s.id === stickyVariation) || optimizationCopy.stickyCTA[0];
    setStickyText(activeStickyVariation.text);
    
    // Time-based Personalization
    const timeTimeout = setTimeout(() => {
        const timeCopy = optimizationCopy.personalization.time30s;
        if (activeMicrocopyId === timeCopy.microcopy_id) {
            setMicrocopy({ id: timeCopy.microcopy_id, text: timeCopy.text_override });
        }
    }, 30000);

    // Scroll-based Personalization
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-offer');
      if (heroSection) {
        const { bottom, top } = heroSection.getBoundingClientRect();
        setIsStickyVisible(bottom < 0 || top > window.innerHeight);
      }
      
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > 50) {
        const scrollCopy = optimizationCopy.personalization.scroll50;
        if (activeMicrocopyId === scrollCopy.microcopy_id) {
          setMicrocopy({ id: scrollCopy.microcopy_id, text: scrollCopy.text_override });
        }
      }
    };
    
    const debouncedScrollHandler = debounce(handleScroll, 300);
    window.addEventListener('scroll', debouncedScrollHandler);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
      clearTimeout(timeTimeout);
    };
  }, [activeMicrocopyId]);
  
  const handleCtaClick = (variationId: string) => {
    if (!hasLoggedConversion) {
      logConversion(variationId);
      setHasLoggedConversion(true);
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Sticky Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm shadow-md transition-transform duration-300",
        isStickyVisible ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg hidden sm:inline">{stickyText}</span>
          <PlanSignupDialog program={productOffer}>
            <Button onClick={() => handleCtaClick(optimizationCopy.stickyCTA.find(s => s.text === stickyText)?.id || 'sticky_unknown')} className="font-bold w-full sm:w-auto">
              {copy.cta} {copy.emoji}
            </Button>
          </PlanSignupDialog>
        </div>
      </div>

      {/* Hero Section */}
      <section id="hero-offer" className="relative py-20 md:py-32 text-center">
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight uppercase text-foreground drop-shadow-lg">
              {copy.headline}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground drop-shadow-md">
              {copy.subheadline}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <PlanSignupDialog program={productOffer}>
                  <Button onClick={() => handleCtaClick(microcopy.id)} size="lg" className="font-bold text-lg h-14 px-10">
                    {copy.cta} {copy.emoji}
                  </Button>
              </PlanSignupDialog>
              <p className="text-sm text-muted-foreground h-8">{microcopy.text}</p>
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
                    <Button onClick={() => handleCtaClick('main_content_cta')} size="lg" className="w-full mt-4 font-bold">
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