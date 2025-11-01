/**
 * File path: /tests/models/Organisation.test.ts
 * Author: Denise Alexander
 * Date Created: 31/10/2025
 */

import mongoose, { Types } from 'mongoose';
import { Organisation } from '@/models/Organisation';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Organisation Model', () => {
  // Mock User
  const userId = new Types.ObjectId();

  // TEST 1:  Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const org = new Organisation({});
    await expect(org.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful organisation creation with valid data
  it('should create an organisation successfully with valid data.', async () => {
    const org = await Organisation.create({
      name: 'Sunny Age Care',
      createdBy: userId,
    });

    expect(org._id).toBeDefined();
    expect(org.name).toBe('Sunny Age Care');
    expect(org.createdBy.toString()).toBe(userId.toString());
    expect(org.members).toEqual([]);
    expect(org.inviteCodes).toEqual([]);
  });

  // TEST 3: Enforces unique organisation name
  it('should not allow duplicate organisation names.', async () => {
    const orgData = { name: 'Unique Name', createdBy: userId };
    await Organisation.create(orgData);
    await expect(Organisation.create(orgData)).rejects.toThrow();
  });

  // TEST 4: Invite code generation
  it('should generate a valid invite code for management role.', async () => {
    const org = await Organisation.create({
      name: 'Org With Invite',
      createdBy: userId,
    });

    const invite = org.generateInviteCode('management');
    expect(invite.code).toMatch(/^[0-9A-F]{6}$/);
    expect(invite.role).toBe('management');
    expect(invite.used).toBe(false);
    expect(invite.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(org.inviteCodes).toHaveLength(1);

    await org.save();
    const found = await Organisation.findById(org._id);
    expect(found?.inviteCodes[0].code).toBe(invite.code);
  });

  // TEST 5: Invite code expiration timing
  it('should set invite code expiration ~15 minutes ahead.', async () => {
    const org = await Organisation.create({
      name: 'Expiring Org',
      createdBy: userId,
    });

    const invite = org.generateInviteCode('carer');
    const diffMs = invite.expiresAt.getTime() - Date.now();
    const diffMinutes = diffMs / (1000 * 60);

    expect(diffMinutes).toBeGreaterThanOrEqual(14.9);
    expect(diffMinutes).toBeLessThanOrEqual(15.1);
  });
});
