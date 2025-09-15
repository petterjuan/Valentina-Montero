
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
      message: "La variable de entorno <b>FIREBASE_SERVICE_ACCOUNT_KEY</b> no está configurada.",
    };
  }

  let serviceAccount: admin.ServiceAccount | undefined;
  try {
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
    const missing = requiredFields.filter(field => !(field in serviceAccount!));

    if (missing.length > 0) {
      return { status: "error", message: `La clave está incompleta. Faltan los campos: ${missing.join(', ')}.` };
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    
    await admin.firestore().listCollections();

    return { status: "success", message: `Conectado exitosamente al proyecto de Firebase: <b>${serviceAccount.project_id}</b>.` };
  } catch (error: any) {
    const projectId = serviceAccount?.project_id || 'tu-proyecto';
    let errorMessage = `Falló la conexión a Firebase. Error: ${error.message}`;

    if (error.code === 7 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
       errorMessage = `La API de Cloud Firestore no ha sido habilitada en el proyecto <b>${projectId}</b>. <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${projectId}" target="_blank" rel="noopener noreferrer" class="underline font-bold">Haz clic aquí para habilitarla</a>, espera 5 minutos y refresca.`;
    } else if (error.code === 5 || (error.message && error.message.includes('NOT_FOUND'))) {
       errorMessage = `Error: <b>5 NOT_FOUND</b>. Esto casi siempre significa que la base de datos de Firestore aún no ha sido creada en tu proyecto. <br><b>Solución:</b> Ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" class="underline font-bold">Consola de Firebase</a>, selecciona el proyecto <b>${projectId}</b>, haz clic en <b>Build > Firestore Database</b> y luego en <b>'Crear base de datos'</b>.`;
    }
    
    return { status: "error", message: errorMessage };
  }
}

// --- CHECK 2: MongoDB ---
async function checkMongoDB() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri) {
        return { status: 'error', message: 'La variable de entorno <b>MONGODB_URI</b> no está configurada.' };
    }
     if (!dbName) {
        return { status: 'error', message: 'La variable de entorno <b>MONGODB_DB_NAME</b> no está configurada. Debe ser el nombre de tu base de datos en MongoDB Atlas.' };
    }

    if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
        return { status: 'error', message: `Formato de MONGODB_URI inválido. Debe empezar con 'mongodb+srv://' o 'mongodb://'.` };
    }

    let client;
    try {
        client = await mongoose.connect(uri, { 
            dbName: dbName,
            serverSelectionTimeoutMS: 5000 
        });
        
        await client.connection.db.command({ ping: 1 });
        
        return { status: 'success', message: `Conectado exitosamente a la base de datos: <b>${dbName}</b>.` };
    } catch (error: any) {
        let errorMessage = `Falló la conexión a MongoDB. Error: ${error.message}`;
        if (error.message && (error.message.includes('bad auth') || error.message.includes('Authentication failed'))) {
            errorMessage = "Falló la autenticación con MongoDB. Revisa que el usuario y la contraseña en la <b>MONGODB_URI</b> sean correctos."
        }
        if (error.message && error.message.includes('command')) {
             errorMessage = `El comando de prueba falló. Esto puede pasar si la URI de conexión no incluye un nombre de base de datos y la variable <b>MONGODB_DB_NAME</b> no está configurada. Error: ${error.message}`;
        }
        return { status: 'error', message: errorMessage };
    } finally {
        if (client) {
            await mongoose.disconnect();
        }
    }
}

// --- CHECK 3: Shopify ---
async function checkShopify() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!domain) return { status: 'error', message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STORE_DOMAIN</b>.` };
    if (!token) return { status: 'error', message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STOREFRONT_ACCESS_TOKEN</b>.` };

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
        return { status: 'success', message: `Conectado exitosamente a la tienda de Shopify: <b>${shopName}</b>.` };

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
