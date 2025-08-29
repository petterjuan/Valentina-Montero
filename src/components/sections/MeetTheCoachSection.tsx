import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function MeetTheCoachSection() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              Meet Your Coach, Valentina Montero
            </h2>
            <p className="mt-6 text-muted-foreground">
              With over a decade of experience in personal training and nutrition science, I've dedicated my career to helping people unlock their true potential. My philosophy goes beyond physical transformation; it's about building sustainable habits, fostering a resilient mindset, and creating a life you love in a body you feel proud of.
            </p>
            <p className="mt-4 text-muted-foreground">
              Whether you're just starting out or looking to break through a plateau, I provide the expertise, support, and accountability you need to succeed.
            </p>
            <Button asChild size="lg" className="mt-8 font-bold">
              <Link href="#programs">I’m Ready!</Link>
            </Button>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src="https://picsum.photos/600/700"
              alt="Coach Valentina Montero"
              width={600}
              height={700}
              className="rounded-lg shadow-lg aspect-[6/7] object-cover w-full"
              data-ai-hint="fitness woman"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
