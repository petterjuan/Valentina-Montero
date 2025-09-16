
"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PlanSignupForm from "@/components/sections/PlanSignupForm";
import type { Program } from "@/components/sections/CoachingProgramsSection";

interface PlanSignupDialogProps {
    program: Program;
    children: React.ReactNode;
}

export default function PlanSignupDialog({ program, children }: PlanSignupDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <PlanSignupForm plan={program} onSubmitted={() => {}} />
            </DialogContent>
        </Dialog>
    );
}
