
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
let cachedConnection: typeof mongoose | null = null;

async function connectToDb() {
  if (cachedConnection) {
    // console.log("✅ Using cached MongoDB connection.");
    return cachedConnection;
  }

  try {
    console.log("🟡 Attempting to establish a new MongoDB connection...");
    const connection = await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
    });
    console.log(`✅ New MongoDB connection established successfully to database: ${connection.connection.db.databaseName}`);
    cachedConnection = connection;
    return connection;
  } catch (e) {
    console.error("🔥 FAILED TO CONNECT TO MONGODB. This is likely an issue with your MONGODB_URI credentials, network access, or DB_NAME.");
    console.error("🔥 Detailed Error:", e);
    throw new Error('Failed to connect to the database.');
  }
}

export default connectToDb;
