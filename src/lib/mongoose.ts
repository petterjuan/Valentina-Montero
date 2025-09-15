
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
    console.log("🟢 Using cached MongoDB connection.");
    return cachedConnection;
  }

  // If in development, clear the model cache to prevent model re-registration errors on hot reloads.
  if (process.env.NODE_ENV === 'development') {
    mongoose.models = {};
  }
  
  // Construct the final URI
  const uriWithDb = MONGODB_URI.includes('?') 
    ? MONGODB_URI.replace('?', `/${MONGODB_DB_NAME}?`)
    : `${MONGODB_URI}/${MONGODB_DB_NAME}`;
    
  const finalUri = `${uriWithDb}${uriWithDb.includes('?') ? '&' : '?'}authSource=admin`;


  try {
    console.log(`🟡 Attempting to establish a new MongoDB connection to DB: ${MONGODB_DB_NAME}`);
    console.log(`🟡 With URI: ${finalUri.replace(/:([^:]+)@/, ':*****@')}`);
    const connection = await mongoose.connect(finalUri, {
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
