import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

const programs = [
  {
    title: "6-Week Coaching Plan",
    price: 167,
    features: [
      "Personalized workout plan",
      "Bi-weekly progress check-ins",
      "Nutrition & macro guidance",
      "24/7 Q&A support",
      "Mindset & motivation focus",
    ],
    shopifyLink: "#",
  },
  {
    title: "12-Week Coaching Plan",
    price: 267,
    isPopular: true,
    features: [
      "All 6-week plan features",
      "+ Mini Guide on Supplements & Vitamins",
      "Advanced progress tracking",
      "Customized meal suggestions",
      "End-of-plan strategy session",
    ],
    shopifyLink: "#",
  },
];

export default function CoachingProgramsSection() {
  return (
    <section id="programs" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            Ready to Commit?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that best fits your goals. Let's start this
            journey together.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
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
                    MOST POPULAR
                  </div>
                )}
                <CardTitle className="text-2xl font-headline">{program.title}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">${program.price}</span>
                  <span className="text-sm font-semibold text-muted-foreground">/ plan</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {program.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full font-bold">
                  <a href={program.shopifyLink}>Choose Plan</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
