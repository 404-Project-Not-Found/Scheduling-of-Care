import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../jest.setup';
import Occurrence from '@/models/Occurrence';

beforeAll(async () => {
  await connect();
  await Occurrence.init();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Occurrence Model', () => {
  it('fails validation when required fields are missing', async () => {
    const invalid = new Occurrence({});
    await expect(invalid.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('creates an occurrence successfully with defaults and normalization', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const occ = await Occurrence.create({
      careItemSlug: 'Physio-Weekly',
      clientId,
      date: new Date('2025-10-30T00:00:00Z'),
      dateKey: '2025-10-30'
    });

    expect(occ._id).toBeDefined();
    expect(occ.clientId.toString()).toBe(clientId.toString());
    expect(occ.careItemSlug).toBe('physio-weekly');
    expect(occ.status).toBe('Due');
    expect(occ.files).toEqual([]);
    expect(occ.comments).toEqual([]);
    expect(occ.createdAt).toBeInstanceOf(Date);
    expect(occ.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects invalid status values', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const invalid = new Occurrence({
      careItemSlug: 'x',
      clientId,
      date: new Date(),
      dateKey: '2025-10-31',
      status: 'Unknown',
    } as any);

    await expect(invalid.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('enforces unique (clientId, careItemSlug, dateKey)', async () => {
    const clientId = new mongoose.Types.ObjectId();

    await Occurrence.create({
      careItemSlug: 'abc',
      clientId,
      date: new Date('2025-10-20T00:00:00Z'),
      dateKey: '2025-10-20',
    });

    await expect(
      Occurrence.create({
        careItemSlug: 'ABC',
        clientId,
        date: new Date('2025-10-20T01:00:00Z'),
        dateKey: '2025-10-20',
      })
    ).rejects.toThrow();
  });

  it('exposes supporting index byClient_date_range_slug', async () => {
    const idx = await Occurrence.collection.indexes();
    const hit = idx.find(
      (i) => i.name === 'byClient_date_range_slug' &&
             i.key.clientId === 1 && i.key.date === 1 && i.key.careItemSlug === 1
    );
    expect(hit).toBeDefined();
  });
});
