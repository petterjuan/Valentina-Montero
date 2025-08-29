"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { handleAiGeneration } from "@/app/actions";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full font-bold">
      {pending ? "Generating..." : "Generate Content"}
    </Button>
  );
}

export default function AiGeneratorSection() {
  const initialState = { error: "", data: "" };
  const [state, formAction] = useFormState(handleAiGeneration, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
    if(state.data) {
        toast({
            title: "Success!",
            description: "AI content generated below.",
        });
        formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            AI-Powered Fitness Assistant
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Describe your goal and let our AI create a custom workout, meal tip, or
            social media caption for you. Try &quot;quiero perder peso&quot; or &quot;caption para
            IG sobre mi progreso&quot;.
          </p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          <form ref={formRef} action={formAction} className="space-y-4">
            <Textarea
              name="prompt"
              placeholder="e.g., 'A 3-day workout plan for beginners at home'..."
              rows={3}
              required
            />
            <SubmitButton />
          </form>
          {state.error && (
             <Card className="mt-6 border-destructive bg-destructive/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{state.error}</p>
                    </div>
                </CardContent>
            </Card>
          )}
          {state.data && (
            <Card className="mt-6">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Wand2 className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">Generated Content</h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{state.data}</p>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
