
import { Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.5 4.5a4.5 4.5 0 0 1-4.5 4.5v3.42a2.5 2.5 0 0 1-2.5 2.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5c.1 0 .19.01.28.03V9.5a4.5 4.5 0 0 1-4.5-4.5C4.22 2.78 6.78 0 9.5 0c2.75 0 4.5 1.48 4.5 4.24v1.58Z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-muted/40">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-2">
                 <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} VM Fitness Hub. Todos los derechos reservados.
                 </p>
                 <div className="flex items-center gap-x-2">
                    <Link href="/troubleshoot" className="text-xs text-muted-foreground hover:text-primary">
                        System Status
                    </Link>
                    <span className="text-muted-foreground">·</span>
                    <Link href="/admin/leads" className="text-xs text-muted-foreground hover:text-primary">
                        Administración
                    </Link>
                 </div>
            </div>
          <div className="flex flex-col items-center md:items-end gap-4">
             <div className="flex items-center gap-4">
             </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="TikTok">
                  <TikTokIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="YouTube">
                  <Youtube className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
