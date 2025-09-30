import type { Metadata } from "next";
import { Poppins, Roboto_Mono } from "next/font/google";
import { cn } from "lib/utils";
import { Toaster } from "components/ui/toaster";
import Header from "components/layout/Header";
import Footer from "components/layout/Footer";
import BackToTopButton from "components/layout/BackToTopButton";
import "./globals.css";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-poppins',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: "VM Fitness Hub - Valentina Montero",
  description: "Transforma tu cuerpo y eleva tu vida con coaching personalizado de fitness y nutrición.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="!scroll-smooth">
      <body className={cn('antialiased', poppins.variable, robotoMono.variable)}>
        <div className="relative flex min-h-dvh flex-col bg-background">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
        <BackToTopButton />
      </body>
    </html>
  );
}
