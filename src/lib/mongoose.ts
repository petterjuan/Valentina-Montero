
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDb() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI no está definida en las variables de entorno.");
    throw new Error(
      'Por favor, define la variable MONGODB_URI dentro de .env'
    );
  }
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Conexión a MongoDB establecida.");
      return mongoose;
    }).catch(err => {
      console.error("❌ Error en la conexión inicial a MongoDB:", err.message);
      cached.promise = null; // Reset promise on error
      throw err; // Re-throw to be caught by caller
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDb;
