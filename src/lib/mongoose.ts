
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}
if (!MONGODB_DB_NAME) {
    console.warn("⚠️ MONGODB_DB_NAME is not defined. Mongoose will use the default database from the connection string.");
}

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
  if (cached.conn) {
    // console.log("✅ Using cached MongoDB connection.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME, // Specify the database name here
    };

    console.log("🟡 Attempting to connect to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`✅ New MongoDB connection established successfully to database: ${mongoose.connection.db.databaseName}`);
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    console.error("🔥 FAILED TO CONNECT TO MONGODB. This is likely an issue with your MONGODB_URI credentials or network access.");
    console.error("🔥 Detailed Error:", e);
    throw e; // Re-throw to be caught by the calling function, which will prevent rendering.
  }

  return cached.conn;
}

export default connectToDb;
