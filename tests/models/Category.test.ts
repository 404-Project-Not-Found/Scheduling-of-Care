import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../jest.setup';
import Category from '@/models/Category';

beforeAll(async () => {
  await connect();
  await Category.init();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Category Model', () => {
  it('fails validation when required fields are missing', async () => {
    const invalid = new Category({});
    await expect(invalid.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('creates a category successfully with valid data', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const cat = await Category.create({
      name: 'Therapy',
      slug: 'therapy',
      clientId,
      aliases: ['speech', 'physio'],
    });

    expect(cat._id).toBeDefined();
    expect(cat.name).toBe('Therapy');
    expect(cat.slug).toBe('therapy');
    expect(cat.clientId?.toString()).toBe(clientId.toString());
    expect(cat.aliases).toEqual(['speech', 'physio']);
    expect(cat.createdAt).toBeInstanceOf(Date);
    expect(cat.updatedAt).toBeInstanceOf(Date);
  });

  it('defaults aliases to [] when not provided', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const cat = await Category.create({
      name: 'Equipment',
      slug: 'equipment',
      clientId,
    });
    expect(cat.aliases).toEqual([]);
  });

  it('enforces unique (clientId, slug)', async () => {
    const clientId = new mongoose.Types.ObjectId();

    await Category.create({ name: 'Therapy', slug: 'therapy', clientId });
    await expect(
      Category.create({ name: 'Therapy-2', slug: 'therapy', clientId })
    ).rejects.toThrow();

    const otherClient = new mongoose.Types.ObjectId();
    const ok = await Category.create({ name: 'Therapy-x', slug: 'therapy', clientId: otherClient });
    expect(ok._id).toBeDefined();
  });

  it('exposes the compound index (clientId, slug)', async () => {
    const idx = await Category.collection.indexes();
    const compound = idx.find((i) => i.key.clientId === 1 && i.key.slug === 1);
    expect(compound).toBeDefined();
  });
});
