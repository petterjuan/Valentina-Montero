
'use client';

import * as React from "react";
import { CheckCircle, XCircle, FileText, Loader2, RefreshCw, ZoomIn } from "lucide-react";
import { getLogs, getSystemStatuses } from "lib/actions";
import { type LogEntry, type SystemStatus } from "types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "components/ui/dialog";

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


export default function TroubleshootPage() {
    const [statuses, setStatuses] = React.useState<SystemStatus>({});
    const [logs, setLogs] = React.useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const runChecks = React.useCallback(async () => {
      try {
          const [fetchedStatuses, fetchedLogs] = await Promise.all([
              getSystemStatuses(),
              getLogs(15),
          ]);
          setStatuses(fetchedStatuses);
          setLogs(fetchedLogs);
      } catch (error) {
          console.error("Failed to run system checks:", error);
          // Optionally set an error state to show in the UI
      }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await runChecks();
        setIsRefreshing(false);
    };

    React.useEffect(() => {
        setIsLoading(true);
        runChecks().finally(() => setIsLoading(false));
    }, [runChecks]);

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
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500">Última comprobación: {new Date().toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        {isRefreshing ? 'Refrescando...' : 'Refrescar'}
                                    </Button>
                                </div>
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
                                                <TableHead className="text-right">Detalles</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.length > 0 ? (
                                                logs.map(log => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">{log.message}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'default'}>
                                                                {log.level}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs">
                                                            {new Date(log.timestamp).toLocaleString('es-ES', {
                                                                year: 'numeric', month: 'short', day: 'numeric', 
                                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <ZoomIn className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-2xl">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Detalles del Evento</DialogTitle>
                                                                            <DialogDescription>
                                                                                A continuación se muestran los metadatos completos del evento.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <pre className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-xs overflow-auto max-h-[60vh]">
                                                                            {JSON.stringify(log.metadata, null, 2)}
                                                                        </pre>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
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
