import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
/*const options = {
    tls: true,
    serverSelectionTimeoutMS: 5000
}; */ // for MongoClient to add ssl, authSoruce, etc. if needed 

// Ensure uri exists before attempting connection
if(!MONGODB_URI) {
    throw new Error("Please add your Mongo URI to .env.local");
}

declare global{
    var _mongooseConnection: {
        isConnected?: boolean;
    };
}

global._mongooseConnection = global._mongooseConnection || {};

export const connectDB = async () => {
    if(global._mongooseConnection.isConnected){
        return;
    }

    try{
        await mongoose.connect(MONGODB_URI);
        global._mongooseConnection.isConnected = true;
        console.log("MongoDB connected via Mongoose");
    }
    catch(err){
        console.error("MongoDB connection error", err);
        throw err;
    }
}

/* let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// For development, a single MongoClient instance
if(process.env.NODE_ENV === "development"){
    if(!global._mongoClientPromise){
        const client = new MongoClient(uri, options); // creates a new MongoClient instance
        global._mongoClientPromise = client.connect(); // connect and save the promise globally
    }
    clientPromise = global._mongoClientPromise;
}
else{
    // For production, always create a new client and connect
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise; */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
    tls: true,
    serverSelectionTimeoutMS: 5000
}; // for MongoClient to add ssl, authSoruce, etc. if needed

// Ensure uri exists before attempting connection
if(!uri) {
    throw new Error("Please add your Mongo URI to .env.local");
}

declare global{
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// For development, a single MongoClient instance
if(process.env.NODE_ENV === "development"){
    if(!global._mongoClientPromise){
        const client = new MongoClient(uri, options); // creates a new MongoClient instance
        global._mongoClientPromise = client.connect(); // connect and save the promise globally
    }
    clientPromise = global._mongoClientPromise;
}
else{
    // For production, always create a new client and connect
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;