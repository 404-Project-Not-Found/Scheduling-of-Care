import mongoose from 'mongoose';

// Load the MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

// Ensure uri exists before attempting connection
if (!MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

/**
 * To prevent multiple DB connections, we use a global cache object that persists
 * across hot reloads and API calls.
 */
declare global {
  // Extends the global object to include our cached connection state
  var _mongooseConnection: {
    conn: typeof mongoose | null; // active connection instance (if ready)
    promise: Promise<typeof mongoose> | null; // pending connection promise (if still connecting)
  };
}

// Initialises global cache
global._mongooseConnection = global._mongooseConnection || {
  conn: null,
  promise: null,
};

/**
 * Connects to MongoDB using Mongoose
 * @returns existing connection if already established
 * else, starts a new connection and caches it globally
 */
export async function connectDB() {
  // Reuses cached connection (if it exists)
  if (global._mongooseConnection.conn) {
    return global._mongooseConnection.conn;
  }

  // If no active promise start a new connection
  if (!global._mongooseConnection.promise) {
    global._mongooseConnection.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false, // disable mongoose buffering
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  // Ensures multiple calls share the same connection
  global._mongooseConnection.conn = await global._mongooseConnection.promise;
  return global._mongooseConnection.conn;
}
