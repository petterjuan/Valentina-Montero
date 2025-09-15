
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}
if (!MONGODB_DB_NAME) {
    throw new Error("Please define the MONGODB_DB_NAME environment variable inside .env");
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
    console.log("🟢 Using cached MongoDB connection.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME,
    };

    console.log(`🟡 Attempting to establish a new MongoDB connection to DB: ${MONGODB_DB_NAME}`);
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log(`✅ New MongoDB connection established successfully to database: ${mongoose.connection.db.databaseName}`);
      return mongoose;
    }).catch(err => {
        console.error("🔥 FAILED TO CONNECT TO MONGODB. This is likely an issue with your MONGODB_URI credentials, network access, or DB_NAME.");
        console.error("🔥 Detailed Error:", err);
        cached.promise = null; // Reset promise on error
        throw err; // Rethrow to be caught by caller
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
  
  return cached.conn;
}

export default connectToDb;
