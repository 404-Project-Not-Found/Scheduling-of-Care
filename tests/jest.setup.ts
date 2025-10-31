import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// -------------------------------------------------------
// Jest setup and teardown hooks
// -------------------------------------------------------

// MongoMemoryServer instance for in-memory MongoDB
let mongo: InstanceType<typeof MongoMemoryServer>;

// Increase timeout for setup
jest.setTimeout(300000);

// Connects to a new in-memory db before all tests
export const connect = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
};

// Clears all documents from all collections to ensure tests are isolated
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

// Drops test db, closes Mongoose connection and stops MongoMemoryServer after all tests
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongo) {
    await mongo.stop();
  }
};