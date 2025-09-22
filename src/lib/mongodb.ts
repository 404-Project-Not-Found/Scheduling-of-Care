import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

// Ensure uri exists before attempting connection
if (!MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

declare global {
  var _mongooseConnection: {
    isConnected?: boolean;
  };
}

global._mongooseConnection = global._mongooseConnection || {};

export const connectDB = async () => {
  if (global._mongooseConnection.isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    global._mongooseConnection.isConnected = true;
    console.log('MongoDB connected via Mongoose');
  } catch (err) {
    console.error('MongoDB connection error', err);
    throw err;
  }
};
