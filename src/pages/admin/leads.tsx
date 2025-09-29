
import React, { useEffect, useState } from 'react';
import { getFirestore } from '../../lib/firebase';
import { type Lead } from "@/types";
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
import { Users } from "lucide-react";


async function getLeadsForAdmin(): Promise<Lead[]> {
  const firestore = getFirestore();
  if (!firestore) {
    console.error("Firestore not configured, cannot fetch leads.");
    throw new Error("La base de datos de Firestore no está disponible.");
  }
  
  try {
    const leadsSnapshot = await firestore.collection('leads')
        .orderBy('createdAt', 'desc')
        .get();
        
    if (leadsSnapshot.empty) {
      return [];
    }
    
    const leads = leadsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        source: data.source || 'N/A',
        status: data.status || 'N/A',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Lead;
    });

    return leads;
  } catch (error) {
    console.error("Error fetching leads from Firestore:", error);
    throw new Error("No se pudieron cargar los prospectos desde la base de datos.");
  }
}


export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        const data = await getLeadsForAdmin();
        setLeads(data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error desconocido.');
      } finally {
        setLoading(false);
      }
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
                { loading
                  ? "Cargando prospectos..."
                  : `${leads.length} prospecto(s) ordenados por fecha de registro.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-24 text-center flex items-center justify-center">Cargando...</div>
              ) : error ? (
                <div className="h-24 text-center flex items-center justify-center text-destructive">{error}</div>
              ) : (
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
                    {leads.length > 0 ? (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
