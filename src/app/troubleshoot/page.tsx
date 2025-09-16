
'use client';

import { CheckCircle, XCircle, FileText, Loader2, ServerCrash } from "lucide-react";
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import TestimonialModel from "@/models/Testimonial";
import { getFirestore } from "@/lib/firebase";
import { getLogs } from "@/app/actions";
import { type LogEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

// Helper function to create a status component
const StatusCheck = ({
  title,
  status,
  message,
}: {
  title: string;
  status: "success" | "error";
  message: string;
}) => {
  return (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 ${
        status === "success"
          ? "border-green-300 bg-green-50"
          : "border-red-300 bg-red-50"
      }`}
    >
      {status === "success" ? (
        <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-6 w-6 shrink-0 text-red-600" />
      )}
      <div>
        <h3
          className={`font-semibold ${
            status === "success" ? "text-green-800" : "text-red-800"
          }`}
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    </div>
  );
};

// --- CHECK 1: Firebase ---
async function checkFirebase() {
  // The check is now much simpler. We just try to get the instance.
  // The error handling is centralized in getFirestore.
  try {
    const firestore = getFirestore();
    if (!firestore) {
      // The error message from initialization is more descriptive.
       return {
            status: "error" as const,
            message: `La inicialización de Firebase falló. Revisa los logs del servidor para ver el error. Asegúrate de que <b>FIREBASE_SERVICE_ACCOUNT_KEY</b> esté configurada correctamente.`,
        };
    }
    
    // Attempt a simple read operation.
    await firestore.listCollections();

    // Use a try-catch on the env var just to get the project_id for the success message.
    let projectId = 'tu-proyecto';
    try {
        const key = process.env.NEXT_PUBLIC_FIREBASE_CONFIG!;
        const config = JSON.parse(key);
        projectId = config.projectId;
    } catch (e) {}

    return { status: "success" as const, message: `Conectado exitosamente al proyecto de Firebase: <b>${projectId}</b>.` };
  } catch (error: any) {
    let errorMessage = `Falló la conexión a Firestore. Error: ${error.message}`;
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
       errorMessage = `No se pudo conectar al host de Firestore. Revisa tu conexión a internet o la configuración de red.`;
    }
    if (error.code === 7 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
       errorMessage = `Permiso denegado. La API de Cloud Firestore no ha sido habilitada en el proyecto o las credenciales no tienen los permisos correctos. <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview" target="_blank" rel="noopener noreferrer" class="underline font-bold">Haz clic aquí para habilitar la API</a>, espera 5 minutos y refresca.`;
    } else if (error.code === 5 || (error.message && error.message.includes('NOT_FOUND'))) {
       errorMessage = `Error: <b>5 NOT_FOUND</b>. Esto casi siempre significa que la base de datos de Firestore aún no ha sido creada en tu proyecto. <br><b>Solución:</b> Ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" class="underline font-bold">Consola de Firebase</a>, selecciona tu proyecto, haz clic en <b>Build > Firestore Database</b> y luego en <b>'Crear base de datos'</b>.`;
    }
    return { status: "error" as const, message: errorMessage };
  }
}

// --- CHECK 2: MongoDB Connection ---
async function checkMongoDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        return { status: 'error' as const, message: 'La variable de entorno <b>MONGODB_URI</b> no está configurada.' };
    }
    
    if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
        return { status: 'error' as const, message: `Formato de MONGODB_URI inválido. Debe empezar con 'mongodb+srv://' o 'mongodb://'.` };
    }

    try {
        const client = await connectToDb();
        const dbName = client.connection.db.databaseName;
        
        await client.connection.db.command({ ping: 1 });
        
        return { status: 'success' as const, message: `Conectado exitosamente a la base de datos: <b>${dbName}</b>.` };
    } catch (error: any) {
        let errorMessage = `Falló la conexión a MongoDB. Error: ${error.message}`;
        if (error.message && (error.message.includes('bad auth') || error.message.includes('Authentication failed'))) {
            errorMessage = "Falló la autenticación con MongoDB. Revisa que el usuario y la contraseña en la <b>MONGODB_URI</b> sean correctos."
        }
        if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
             errorMessage = `No se pudo encontrar el host del servidor de MongoDB. Revisa que el hostname en tu <b>MONGODB_URI</b> sea correcto. Error: ${error.message}`;
        }
        return { status: 'error' as const, message: errorMessage };
    }
}

// --- CHECK 3: Shopify ---
async function checkShopify() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!domain) return { status: 'error' as const, message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STORE_DOMAIN</b>.` };
    if (!token) return { status: 'error' as const, message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STOREFRONT_ACCESS_TOKEN</b>.` };

    const endpoint = `https://${domain}/api/2024-04/graphql.json`;
    const query = `{ shop { name } }`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                 throw new Error(`Error de autenticación (Unauthorized). El <b>Storefront Access Token</b> es inválido o no tiene los permisos necesarios. Revisa que el token en Vercel sea correcto y que los permisos de Storefront API en tu app de Shopify estén habilitados (ej. 'unauthenticated_read_products').`);
            }
            if (response.status === 404) {
                 throw new Error(`La URL de la API de Shopify no fue encontrada (404 Not Found). Revisa que el SHOPIFY_STORE_DOMAIN (<b>'${domain}'</b>) sea correcto. Debe ser del tipo 'tu-tienda.myshopify.com', sin 'https://'.`);
            }
            const errorText = await response.text();
            throw new Error(`La API de Shopify devolvió un estado <b>${response.status}</b>. Respuesta: ${errorText}`);
        }
        
        const json = await response.json();
        
        if (json.errors) {
             throw new Error(`Errores de GraphQL: ${json.errors.map((e: any) => e.message).join(', ')}. Esto casi siempre significa que al token le faltan permisos. En Shopify, ve a tu App > Configuration > Storefront API integration y asegúrate de que todos los permisos de lectura de productos estén marcados (ej. 'unauthenticated_read_products').`);
        }

        const shopName = json.data?.shop?.name;
        return { status: 'success' as const, message: `Conectado exitosamente a la tienda de Shopify: <b>${shopName}</b>.` };

    } catch (error: any) {
        return { status: 'error' as const, message: `Falló la conexión a Shopify. Error: ${error.message}` };
    }
}

// --- CHECK 4: MongoDB Data Fetch ---
async function checkMongoData() {
    try {
        const client = await connectToDb();
        if(!client) {
             return { status: 'error' as const, message: `No se pudo establecer conexión con MongoDB para la lectura de datos.` };
        }

        const postCount = await PostModel.countDocuments();
        const testimonialCount = await TestimonialModel.countDocuments();
        const dbName = client.connection.db.databaseName;

        return { 
            status: 'success' as const, 
            message: `Lectura exitosa. Se encontraron <b>${postCount} posts</b> y <b>${testimonialCount} testimonios</b> en la base de datos <b>${dbName}</b>.`
        };

    } catch (error: any) {
        return { status: 'error' as const, message: `Falló la lectura de datos de MongoDB. Error: ${error.message}` };
    }
}

type Status = {
    status: 'success' | 'error';
    message: string;
};

export default function TroubleshootPage() {
    const [statuses, setStatuses] = useState<{ [key: string]: Status | null }>({});
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function runChecks() {
            setIsLoading(true);
            const [
                firebaseStatus, 
                mongoStatus, 
                shopifyStatus, 
                mongoDataStatus,
                fetchedLogs
            ] = await Promise.all([
                checkFirebase(),
                checkMongoDB(),
                checkShopify(),
                checkMongoData(),
                getLogs(15),
            ]);
            
            setStatuses({
                firebase: firebaseStatus,
                mongo: mongoStatus,
                shopify: shopifyStatus,
                mongoData: mongoDataStatus,
            });
            setLogs(fetchedLogs);
            setIsLoading(false);
        }
        runChecks();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-4xl mx-auto">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl font-bold font-headline text-gray-800">
                            Página de Diagnóstico del Sistema
                        </h1>
                        <p className="mt-2 text-lg text-gray-500">
                            Resumen del estado de las conexiones y registro de eventos recientes.
                        </p>
                    </header>
                    
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                {statuses.firebase && <StatusCheck title="Conexión a Firebase (Firestore)" {...statuses.firebase} />}
                                {statuses.mongo && <StatusCheck title="Conexión a MongoDB" {...statuses.mongo} />}
                                {statuses.mongoData && <StatusCheck title="Lectura de Datos de MongoDB" {...statuses.mongoData} />}
                                {statuses.shopify && <StatusCheck title="Conexión a Shopify Storefront API" {...statuses.shopify} />}
                            </div>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Registro de Eventos Recientes
                                    </CardTitle>
                                    <CardDescription>
                                        Mostrando los últimos 15 eventos registrados en el sistema.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Evento</TableHead>
                                                <TableHead>Nivel</TableHead>
                                                <TableHead className="text-right">Fecha</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.length > 0 ? (
                                                logs.map(log => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">{log.message}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                                                                {log.level}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs">
                                                            {new Date(log.timestamp).toLocaleString('es-ES', {
                                                                year: 'numeric', month: 'short', day: 'numeric', 
                                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                            })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        No hay registros de eventos para mostrar.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <footer className="mt-12 text-center text-sm text-gray-400">
                        <p>Esta página es solo para fines de diagnóstico y no es visible para los usuarios habituales.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}

    