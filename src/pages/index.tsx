
import React from 'react';
import HeroSection from "@/components/sections/HeroSection";
import LeadMagnetSection from "@/components/sections/LeadMagnetSection";
import CoachingProgramsSection from "@/components/sections/CoachingProgramsSection";
import MeetTheCoachSection from "@/components/sections/MeetTheCoachSection";
import AiGeneratorSection from "@/components/sections/AiGeneratorSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import BlogSection from "@/components/sections/BlogSection";

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
