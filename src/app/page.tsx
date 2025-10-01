import AiGeneratorSection from "@/components/sections/AiGeneratorSection";
import BlogSection from "@/components/sections/BlogSection";
import CoachingProgramsSection from "@/components/sections/CoachingProgramsSection";
import HeroSection from "@/components/sections/HeroSection";
import LeadMagnetSection from "@/components/sections/LeadMagnetSection";
import MeetTheCoachSection from "@/components/sections/MeetTheCoachSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";

export default function Home() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold py-4 bg-yellow-300 text-black">VERSIÓN ESTABLE RESTAURADA</h1>
      <HeroSection />
      <LeadMagnetSection />
      <CoachingProgramsSection />
      <MeetTheCoachSection />
      <AiGeneratorSection />
      <TestimonialsSection />
      <BlogSection />
    </>
  );
}
