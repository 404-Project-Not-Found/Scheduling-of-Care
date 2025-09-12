// Connection helper for server
import "server-only";
import { MongoClient, Db} from "mongodb";

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.MONGO_DB_NAME;

// Ensure that uri and dbName is not empty
if(!uri) throw new Error("Missing MONGO_DB_URI in .env.local!!!");
if(!dbName) throw new Error("Missing MONGO_DB_NAME in .env.local!!!");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if(!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
    const client = await clientPromise;
    return client.db(dbName);
}



