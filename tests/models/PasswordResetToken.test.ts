/**
 * File path: /tests/models/PasswordResetToken.test.ts
 * Author: Denise Alexander
 * Date Created: 31/10/2025
 */

import mongoose, { Types } from 'mongoose';
import PasswordResetToken from '@/models/PasswordResetToken';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Password Reset Token Model', () => {
  // Mock User
  const userId = new Types.ObjectId();

  // TEST 1:  Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const tokenDoc = new PasswordResetToken({});
    await expect(tokenDoc.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful password reset token creation with valid data
  it('should create a password reset token successfully.', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 15);
    const tokenDoc = await PasswordResetToken.create({
      userID: userId,
      token: 'TOKEN123ABC',
      expiresAt: expires,
    });

    expect(tokenDoc._id).toBeDefined();
    expect(tokenDoc.userID.toString()).toBe(userId.toString());
    expect(tokenDoc.token).toBe('TOKEN123ABC');
    expect(tokenDoc.expiresAt).toBeInstanceOf(Date);
    expect(tokenDoc.expiresAt.getTime()).toBeCloseTo(expires.getTime(), -1);
  });

  // TEST 3: Enforces unique tokens
  it('should not allow duplicate token strings.', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 10);

    const base = {
      userID: userId,
      token: 'DUPLICATE_TOKEN',
      expiresAt: expires,
    };

    await PasswordResetToken.create(base);
    await expect(PasswordResetToken.create(base)).rejects.toThrow();
  });

  // TEST 4: Expiration validation
  it('should fail validation if expiresAt is missing or invalid.', async () => {
    const invalidDoc = new PasswordResetToken({
      userID: userId,
      token: 'INVALID_EXPIRY',
    });

    await expect(invalidDoc.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 5: User reference integrity
  it('should allow setting and retrieving a referenced userId.', async () => {
    const expires = new Date(Date.now() + 60000);
    const tokenDoc = await PasswordResetToken.create({
      userID: userId,
      token: 'USER_LINKED_TOKEN',
      expiresAt: expires,
    });

    const found = await PasswordResetToken.findById(tokenDoc._id);
    expect(found?.userID.toString()).toBe(userId.toString());
  });
});
