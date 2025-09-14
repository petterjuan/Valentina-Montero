
import { CheckCircle, XCircle } from "lucide-react";
import * as admin from "firebase-admin";
import mongoose from "mongoose";

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
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    return {
      status: "error",
      message: "La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.",
    };
  }

  try {
    let serviceAccount;
    try {
      const decoded = Buffer.from(key, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
    } catch {
      try {
        serviceAccount = JSON.parse(key);
      } catch (jsonError) {
        return { status: "error", message: `La clave de Firebase no es un JSON válido ni está codificada en Base64.` };
      }
    }
    
    const requiredFields = ["project_id", "private_key", "client_email"];
    const missing = requiredFields.filter(field => !serviceAccount[field]);

    if (missing.length > 0) {
      return { status: "error", message: `La clave está incompleta. Faltan los campos: ${missing.join(', ')}.` };
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    
    await admin.firestore().listCollections();

    return { status: "success", message: `Conectado exitosamente al proyecto de Firebase: ${serviceAccount.project_id}.` };
  } catch (error: any) {
    let errorMessage = `Falló la conexión a Firebase. Error: ${error.message}`;
    if (error.message && error.message.includes('PERMISSION_DENIED')) {
      errorMessage = `La API de Cloud Firestore no ha sido habilitada en el proyecto <b>${error.message.split('project ')[1]?.split(' ')[0] || 'vm-fitness-hub'}</b>. <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=vm-fitness-hub" target="_blank" rel="noopener noreferrer" class="underline">Haz clic aquí para habilitarla</a>, espera 5 minutos y refresca.`;
    }
    return { status: "error", message: errorMessage };
  }
}

// --- CHECK 2: MongoDB ---
async function checkMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return { status: 'error', message: 'La variable de entorno MONGODB_URI no está configurada.' };
    }

    if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
        return { status: 'error', message: `Formato de MONGODB_URI inválido. Debe empezar con 'mongodb+srv://' o 'mongodb://'. El valor actual es: "${uri.substring(0, 20)}..."` };
    }

    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        }
        return { status: 'success', message: `Conectado exitosamente a la base de datos: ${mongoose.connection.name}.` };
    } catch (error: any) {
        return { status: 'error', message: `Falló la conexión a MongoDB. Error: ${error.message}` };
    }
}

// --- CHECK 3: Shopify ---
async function checkShopify() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!domain || !token) {
        let missingVars = [];
        if (!domain) missingVars.push("SHOPIFY_STORE_DOMAIN");
        if (!token) missingVars.push("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
        return { status: 'error', message: `Configuración incompleta. Faltan las siguientes variables de entorno: ${missingVars.join(', ')}.` };
    }
    
    const endpoint = `https://${domain}/api/2024-04/graphql.json`;
    const query = `{ shop { name } }`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            if (response.status === 404) {
                 throw new Error(`La URL de la API de Shopify no fue encontrada. Revisa que el SHOPIFY_STORE_DOMAIN ('${domain}') sea correcto y no tu dominio personalizado.`);
            }
            if (response.status === 401) {
                 throw new Error(`Error de autenticación (Unauthorized). El Storefront Access Token es inválido o no tiene los permisos necesarios.`);
            }
            throw new Error(`La API de Shopify devolvió un estado ${response.status}.`);
        }
        
        const json = await response.json();
        
        if (json.errors) {
             throw new Error(`Errores de GraphQL: ${json.errors.map((e: any) => e.message).join(', ')}. Esto casi siempre significa que al token le faltan permisos. Ve a la configuración de tu app en Shopify > Storefront API Scopes y asegúrate de haber marcado permisos para leer productos, colecciones, etc.`);
        }

        const shopName = json.data?.shop?.name;
        return { status: 'success', message: `Conectado exitosamente a la tienda de Shopify: ${shopName}.` };

    } catch (error: any) {
        return { status: 'error', message: `Falló la conexión a Shopify. Error: ${error.message}` };
    }
}

export default async function TroubleshootPage() {
  const [firebaseStatus, mongoStatus, shopifyStatus] = await Promise.all([
    checkFirebase(),
    checkMongoDB(),
    checkShopify(),
  ]);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold font-headline text-gray-800">
              Página de Diagnóstico del Sistema
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              Este es un resumen del estado de las conexiones externas de tu
              aplicación.
            </p>
          </header>
          <div className="space-y-6">
            <StatusCheck
              title="Conexión a Firebase (Firestore)"
              status={firebaseStatus.status as "success" | "error"}
              message={firebaseStatus.message}
            />
            <StatusCheck
              title="Conexión a MongoDB"
              status={mongoStatus.status as "success" | "error"}
              message={mongoStatus.message}
            />
             <StatusCheck
              title="Conexión a Shopify Storefront API"
              status={shopifyStatus.status as "success" | "error"}
              message={shopifyStatus.message}
            />
          </div>
          <footer className="mt-12 text-center text-sm text-gray-400">
             <p>Esta página es solo para fines de diagnóstico y no es visible para los usuarios habituales.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
