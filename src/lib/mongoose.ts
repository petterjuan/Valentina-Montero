
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    'Please define the MONGODB_URI environment variable inside .env. MongoDB features will be disabled.'
  );
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    return null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(mongoose => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDb;
