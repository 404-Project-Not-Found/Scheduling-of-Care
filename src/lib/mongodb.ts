
import "server-only";
import { MongoClient, Db} from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME;

const options = {
    tls: true,
    serverSelectionTimeoutMS: 5000
}; // for MongoClient to add ssl, authSoruce, etc. if needed

if(!uri) throw new Error("Missing MONGO_DB_URI in .env.local!!!");
if(!dbName) throw new Error("Missing MONGO_DB_NAME in .env.local!!!");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if(process.env.NODE_ENV == "development") {
    if(!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}
else {
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}
export async function getDb() {
    const client = await clientPromise;
    return client.db(dbName);
}



