/**
 * Filename: /lib/mongodb.ts
 * Author: Zahra Rizqita
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if(!MONGODB_URI) throw new Error("Please add uri into .env.local");

declare global {
    var _mongooseConnection: {isConnected?: boolean} | undefined;
}

export const connectDB = async () => {
    if(global._mongooseConnection?.isConnected) return mongoose.connection;

    try {
        await mongoose.connect(MONGODB_URI);
        global._mongooseConnection = {isConnected: true};
        console.log("MongoDB is connected via Mongoose");
        return mongoose.connection;
    } catch(err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
};