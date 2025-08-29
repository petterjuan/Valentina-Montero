import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center text-center text-white">
      <Image
        src="https://picsum.photos/1920/1080"
        alt="Valentina Montero coaching a client"
        fill
        className="object-cover object-center"
        priority
        data-ai-hint="fitness coach"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight uppercase text-white drop-shadow-lg">
                Transform Your Body, Elevate Your Life
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/90 drop-shadow-md">
                I'm Valentina Montero, and I'm here to guide you on a transformative journey to a stronger, healthier, and more confident you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="font-bold">
                    <Link href="#programs">Start Your Journey</Link>
                </Button>
                <Button asChild variant="link" size="lg" className="text-white hover:text-accent">
                    <Link href="#">Visit My Shopify Store</Link>
                </Button>
            </div>
        </div>
      </div>
    </section>
  );
}
