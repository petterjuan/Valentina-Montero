
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
      // This is a critical configuration error, but logging it here can cause recursion.
      // The error will be surfaced when a component that depends on the DB fails.
      // Throwing an error is better than a silent failure or a recursive crash.
      throw new Error(
        'MONGODB_URI environment variable not set. MongoDB-dependent features will not work.'
      );
    }
    
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch(err => {
      // Reset promise on error to allow retry on next call
      cached.promise = null; 
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
    