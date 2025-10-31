/**
 * File path: /tests/models/User.test.ts
 * Author: Denise Alexander
 * Date Created: 30/09/2025
 */

import mongoose, { Types } from 'mongoose';
import User from '@/models/User';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('User Model', () => {
  // TEST 1:  Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const user = new User({});
    await expect(user.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful user creation with valid data
  it('should create a user successfully with valid data.', async () => {
    const userData = {
      fullName: 'Alice Kim',
      email: 'alice@test.com',
      phone: '0498 765 432',
      password: '#Alice456',
      role: 'carer' as const,
    };

    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.fullName).toBe('Alice Kim');
    expect(user.email).toBe('alice@test.com');
    expect(user.role).toBe('carer');
    expect(user.status).toBe('active');
    expect(user.profilePic).toBeNull();
    expect(user.phone).toBe('0498 765 432');
  });

  // TEST 3: Enforce unique email constraint
  it('should not allow duplicate emails.', async () => {
    const userData2 = {
      fullName: 'Jane Willis',
      email: 'jane@test.com',
      password: '$Jane098',
      role: 'management' as const,
    };

    await User.create(userData2);
    await expect(User.create(userData2)).rejects.toThrow();
  });

  // TEST 4: Optional fields and ObjectId references
  it('should accept optional fields and references.', async () => {
    const orgId = new Types.ObjectId();
    const clientId = new Types.ObjectId();

    const user = await User.create({
      fullName: 'David Choo',
      email: 'david@test.com',
      password: '*David432',
      role: 'carer',
      phone: '0465 987 432',
      organisation: orgId,
      activeClientId: clientId,
    });

    expect(user.phone).toBe('0465 987 432');
    expect(user.organisation?.toString()).toBe(orgId.toString());
    expect(user.activeClientId?.toString()).toBe(clientId.toString());
  });
});
