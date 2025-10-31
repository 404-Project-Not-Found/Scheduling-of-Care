/**
 * File path: /tests/models/FamilyRequest.test.ts
 * Author: Denise Alexander
 * Date Created: 31/10/2025
 */

import mongoose from 'mongoose';
import FamilyRequest from '@/models/FamilyRequest';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Family Request Model', () => {
  // TEST 1:  Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const request = new FamilyRequest({});
    await expect(request.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful family request creation with valid data
  it('should create a family request successfully with valid data.', async () => {
    const reqData = {
      clientId: 'clientabc',
      task: 'Weekly medication reminder',
      change: 'Set day to Monday.',
      requestedBy: 'joey@test.com',
    };

    const request = await FamilyRequest.create(reqData);

    expect(request._id).toBeDefined();
    expect(request.clientId).toBe('clientabc');
    expect(request.task).toBe('Weekly medication reminder');
    expect(request.change).toBe('Set day to Monday.');
    expect(request.requestedBy).toBe('joey@test.com');

    expect(request.status).toBe('Pending');
    expect(request.resolutionDate).toBeNull();
    expect(request.dateRequested).toBeInstanceOf(Date);
  });

  // TEST 3: Enum validation for 'status'
  it('should reject invalid status values.', async () => {
    const invalid = new FamilyRequest({
      clientId: 'client123',
      task: 'Replace toothbrush head',
      change: 'Change to every 2 months.',
      requestedBy: 'joey@test.com',
      status: 'Unknown',
    });

    await expect(invalid.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 4: Updating status and resolution date
  it('should update status and resolution date.', async () => {
    const request = await FamilyRequest.create({
      clientId: 'client456',
      task: 'Buy new socks',
      change: 'Change frequency to every 2 months.',
      requestedBy: 'joey@test.com',
    });

    request.status = 'Implemented';
    request.resolutionDate = new Date();
    await request.save();

    const found = await FamilyRequest.findById(request._id);
    expect(found?.status).toBe('Implemented');
    expect(found?.resolutionDate).toBeInstanceOf(Date);
  });
});
