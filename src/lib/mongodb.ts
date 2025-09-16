import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {}; // for MongoClient to add ssl, authSoruce, etc. if needed

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Ensure uri exists before attempting connection
if(!uri) {
    throw new Error("Please add your Mongo URI to .env.local");
}

// For development, a single MongoClient instance
/*if(process.env.NODE_ENV === "development"){
    if(!(global as any)._mongoClientPromise){
        client = new MongoClient(uri, options); // creates a new MongoClient instance
        (global as any)._mongoClientPromise = client.connect(); // connect and save the promise globally
    }
    clientPromise = (global as any)._mongoClientPromise;
} */

// For production, always create a new client and connect
client = new MongoClient(uri, options);
clientPromise = client.connect();

export default clientPromise;