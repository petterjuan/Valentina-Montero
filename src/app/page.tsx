
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
