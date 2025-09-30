/**
 * Filename: /tests/models/Client.test.ts
 * Author: Denise Alexander
 * Date Created: 30/09/2025
 */

import Client from '@/models/Client';
import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../jest-mongo-setup';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Test suite for Client model
describe('Client Model', () => {
  // Test: Validation of all required fields
  it('should require name, dob, and accessCode', async () => {
    const client = new Client({});
    let error: mongoose.Error.ValidationError | undefined;

    try {
      await client.validate(); // validates w/o saving
    } catch (err) {
      // Captures validation errors
      if (err instanceof mongoose.Error.ValidationError) {
        error = err;
      } else {
        throw err;
      }
    }

    // Assertions: all required fields should trigger a validation error
    expect(error).toBeDefined();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.dob).toBeDefined();
    expect(error?.errors.accessCode).toBeDefined();
    expect(error?.errors.createdBy).toBeDefined();
  });

  // Test: Creates a valid client
  it('should create a valid client when all fields are provided', async () => {
    const client = new Client({
      name: 'Kai Ri', // required
      dob: '1990-01-01', // required
      accessCode: 'ABC123', // required
      avatarUrl: 'http://example.com/avatar.png', // optional
      createdBy: new mongoose.Types.ObjectId(), // required reference
      organisationHistory: [
        { organisation: new mongoose.Types.ObjectId(), status: 'approved' }, // nested required fields
      ],
    });

    // validation should pass without errors
    await expect(client.validate()).resolves.toBeUndefined();
  });
});
