/**
 * File path: /tests/models/Shift.test.ts
 * Author: Denise Alexander
 * Date Created: 31/10/2025
 */

import mongoose, { Types } from 'mongoose';
import Shift from '@/models/Shift';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';

// Global set-up for MongoMemoryServer
beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Shift Model', () => {
  // Mock Organisation and Staff
  const orgId = new Types.ObjectId();
  const staffId = new Types.ObjectId();

  // TEST 1:  Required fields validation
  it('should fail validation when required fields are missing.', async () => {
    const shift = new Shift({});
    await expect(shift.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  // TEST 2: Successful shift creation with valid data
  it('should create a shift successfully with valid data.', async () => {
    const shift = await Shift.create({
      organisation: orgId,
      staff: staffId,
      date: '2025-10-31',
      start: '08:00',
      end: '16:00',
    });

    expect(shift._id).toBeDefined();
    expect(shift.organisation.toString()).toBe(orgId.toString());
    expect(shift.staff.toString()).toBe(staffId.toString());
    expect(shift.date).toBe('2025-10-31');
    expect(shift.start).toBe('08:00');
    expect(shift.end).toBe('16:00');
    expect(shift.label).toBe('Custom');
  });

  // TEST 3: Enforces unique shift creation
  it('should not allow duplicate shift for same organisation, staff and date.', async () => {
    const base = {
      organisation: orgId,
      staff: staffId,
      date: '2025-11-02',
      start: '07:00',
      end: '15:00',
    };

    await Shift.create(base);
    await expect(Shift.create(base)).rejects.toThrow();
  });
});
