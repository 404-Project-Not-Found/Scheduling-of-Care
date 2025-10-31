
import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';
import CareItem from '@/models/CareItem';

beforeAll(async () => {
  await connect();
  await CareItem.init();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('CareItem Model', () => {
  it('should fail validation when required fields are missing', async () => {
    const invalidItem = new CareItem({});
    await expect(invalidItem.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('should create a CareItem successfully with valid data', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const itemData = {
      label: 'Physio Session',
      slug: 'physio-session',
      status: 'active',
      category: 'Physiotherapy',
      clientName: 'Bill Scott',
      categoryId,
      clientId,
      frequencyDays: 7,
      frequencyCount: 1,
      frequencyUnit: 'week',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      notes: 'Weekly physio appointment',
    };

    const item = await CareItem.create(itemData);

    expect(item._id).toBeDefined();
    expect(item.slug).toBe('physio-session');
    expect(item.status).toBe('active');
    expect(item.deleted).toBe(false);
    expect(item.frequencyUnit).toBe('week');
    expect(item.notes).toBe('Weekly physio appointment');
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it('should lowercase the slug automatically and enforce uniqueness', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const baseData = {
      label: 'Speech Therapy',
      slug: 'Speech-Therapy',
      status: 'active',
      category: 'Therapy',
      clientName: 'Charlie Wu',
      categoryId,
      clientId,
      frequencyDays: 30,
      frequencyCount: 1,
      frequencyUnit: 'month',
    };

    const first = await CareItem.create(baseData);
    expect(first.slug).toBe('speech-therapy');

    await expect(CareItem.create(baseData)).rejects.toThrow();
  });

  it('should reject invalid frequencyUnit values', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const invalid = new CareItem({
      label: 'Invalid Unit Test',
      slug: 'invalid-unit-test',
      status: 'active',
      category: 'Misc',
      clientName: 'Alex Li',
      categoryId,
      clientId,
      frequencyDays: 5,
      frequencyCount: 1,
      frequencyUnit: 'hour',
    });

    await expect(invalid.validate()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('should default deleted=false and notes="" when not provided', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const item = await CareItem.create({
      label: 'Medication Review',
      slug: 'medication-review',
      status: 'active',
      category: 'Medical',
      clientName: 'Evelyn Tran',
      categoryId,
      clientId,
      frequencyDays: 90,
      frequencyCount: 3,
      frequencyUnit: 'month',
      dateFrom: '2025-01-01',
    });

    expect(item.deleted).toBe(false);
    expect(item.notes).toBe('');
  });

  it('should include compound index (clientId, categoryId, deleted, status)', async () => {
    const indexes = await CareItem.collection.indexes();

    const compound = indexes.find(
      (i) =>
        i.key.clientId === 1 &&
        i.key.categoryId === 1 &&
        i.key.deleted === 1 &&
        i.key.status === 1
    );

    expect(compound).toBeDefined();
  });
});
