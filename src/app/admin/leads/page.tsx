
'use client';

import { getLeads } from "@/app/actions";
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
import { Users, Loader2 } from "lucide-react";
import { type Lead } from "@/types";
import { useEffect, useState } from "react";


export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      const fetchedLeads = await getLeads();
      setLeads(fetchedLeads);
      setIsLoading(false);
    }
    fetchLeads();
  }, []);

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

    