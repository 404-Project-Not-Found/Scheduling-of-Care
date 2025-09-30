/**
 * Filename: /tests/models/User.test.ts
 * Author: Denise Alexander
 * Date Created: 30/09/2025
 */

import User from '@/models/User';
import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../jest-mongo-setup';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Test suite for User model
describe('User Model', () => {
  // Test: Validation of all required fields
  it('should require fullName, email, password, and role', async () => {
    const user = new User({});
    let error: mongoose.Error.ValidationError | undefined;

    try {
      await user.validate();
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        error = err;
      } else {
        throw err;
      }
    }

    expect(error).toBeDefined();
    expect(error?.errors.fullName).toBeDefined();
    expect(error?.errors.email).toBeDefined();
    expect(error?.errors.password).toBeDefined();
    expect(error?.errors.role).toBeDefined();
  });

  // Test: valid role
  it('should only allow valid role values', async () => {
    const user = new User({
      fullName: 'Emi Wu',
      email: 'emi@example.com',
      password: 'password123',
      role: 'invalid-role' as 'carer' | 'management' | 'family', // intentially wrong
    });

    let error: mongoose.Error.ValidationError | undefined;

    try {
      await user.validate();
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        error = err;
      } else {
        throw err;
      }
    }

    expect(error).toBeDefined();
    expect(error?.errors.role).toBeDefined();
  });

  // Test: Creates a valid user
  it('should create a vlid user when all required fields are provided', async () => {
    const user = new User({
      fullName: 'Mira Leng',
      email: 'mira@example.com',
      password: 'mira',
      role: 'carer',
    });

    await expect(user.validate()).resolves.toBeUndefined();
  });
});
