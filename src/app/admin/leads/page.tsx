
'use client';

import { getLeads, runGeneratePostCron } from "@/app/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, PlusCircle, Loader2 } from "lucide-react";
import { type Lead } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      const fetchedLeads = await getLeads();
      setLeads(fetchedLeads);
      setIsLoading(false);
    }
    fetchLeads();
  }, []);

  const handleGeneratePost = () => {
    startTransition(async () => {
      const result = await runGeneratePostCron();
      if (result.success && result.title) {
        toast({
          title: "¡Artículo Generado!",
          description: `El nuevo post "${result.title}" ha sido creado y publicado.`,
        });
        // Refresh the data on the blog page by navigating
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error al generar el artículo",
          description: result.error || "Ocurrió un error desconocido.",
        });
      }
    });
  };

  return (
    <section className="py-12 sm:py-16 bg-gray-50/50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold font-headline text-gray-800">
              Administración
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              Gestiona los prospectos y las tareas automáticas del sitio.
            </p>
          </header>

          <Card className="mb-8">
            <CardHeader>
                <CardTitle>Generación de Contenido</CardTitle>
                <CardDescription>Usa este botón para generar manualmente un nuevo artículo para el blog usando IA. Esto es útil para pruebas.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGeneratePost} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Generar Nuevo Post (Test)
                    </>
                  )}
                </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Suscriptores
              </CardTitle>
              <CardDescription>
                { !isLoading && leads.length > 0 
                  ? `Mostrando ${leads.length} prospecto(s) ordenados por fecha de registro.`
                  : "Aún no hay prospectos registrados."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Fecha de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                  ) : leads.length > 0 ? (
                    leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.email}</TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{lead.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(lead.createdAt).toLocaleDateString("es-ES", {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No hay prospectos para mostrar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
