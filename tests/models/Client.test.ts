/**
 * File path: /tests/models/Client.test.ts
 * Author: Denise Alexander
 * Date Created: 30/09/2025
 */

import mongoose, { Types } from 'mongoose';
import Client from '@/models/Client';
import User from '@/models/User';
import { Organisation } from '@/models/Organisation';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Client Model', () => {
  let userId: Types.ObjectId;
  let orgId: Types.ObjectId;

  // Creates reusable mock User and Organisation before each test
  beforeEach(async () => {
    const userDoc = await User.create({
      fullName: 'Benny Lou',
      email: 'benny@test.com',
      password: '@Benny123',
      role: 'management',
    });
    const orgDoc = await Organisation.create({
      name: 'Sunny Age Care',
      address: '123 Street',
      createdBy: userDoc._id,
    });

    userId = userDoc._id;
    orgId = orgDoc._id;
  });

  // TEST 1: Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const client = new Client({});

    await expect(client.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful client creation with valid data
  it('should create a client successfully with valid data.', async () => {
    const clientData = {
      name: 'Bill Scott',
      dob: '1967-03-24',
      gender: 'Male',
      accessCode: 'ABC123',
      createdBy: userId,
      phoneNumber: '0423 567 891',
      email: 'bill@test.com',
      organisationHistory: [
        { organisation: orgId, status: 'approved' as const },
      ],
      usersWithAccess: [userId],
    };

    const client = await Client.create(clientData);

    expect(client._id).toBeDefined();
    expect(client.name).toBe('Bill Scott');
    expect(client.createdBy.toString()).toBe(userId.toString());
    expect(client.organisationHistory[0].status).toBe('approved');
    expect(client.organisationHistory[0].organisation.toString()).toBe(
      orgId.toString()
    );
  });

  // TEST 3: Enum validation for organisationHistory.status
  it('should reject invalid organisationHistory status', async () => {
    const invalidClient = new Client({
      name: 'Pen Zhou',
      dob: '1985-05-16',
      gender: 'Female',
      accessCode: 'DEF567',
      createdBy: userId,
      organisationHistory: [
        {
          organisation: orgId,
          status: 'invalid',
        },
      ],
    });

    await expect(invalidClient.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 4: Default values for optional arrays
  it('should default organisationHistory and usersWithAccess to empty arrays.', async () => {
    const client = await Client.create({
      name: 'Charlie Wu',
      dob: '1975-05-08',
      gender: 'Male',
      accessCode: 'GHI789',
      createdBy: userId,
    });

    expect(client.organisationHistory).toEqual([]);
    expect(client.usersWithAccess).toEqual([]);
  });
});
