
import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.warn(
        'MONGODB_URI environment variable not set. MongoDB-dependent features will not work.'
      );
      return null;
    }
    
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("✅ New Mongoose connection established.");
      return mongooseInstance;
    }).catch(err => {
      console.error("❌ Mongoose connection error:", err.message);
      cached.promise = null; // Reset promise on error to allow retry
      throw err;
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

    