// tests/models/Budget.test.ts
import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../jest.setup';
import { BudgetYear } from '@/models/Budget';

describe('BudgetYear model', () => {
  beforeAll(async () => {
    await connect();
    await BudgetYear.init();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('creates and saves a budget year with defaults', async () => {
    const clientId = new mongoose.Types.ObjectId();

    const doc = await BudgetYear.create({
      clientId,
      year: 2025,
    });

    expect(doc._id).toBeDefined();
    expect(doc.clientId.toString()).toBe(clientId.toString());
    expect(doc.year).toBe(2025);


    expect(doc.annualAllocated).toBe(0);
    expect(doc.surplus).toBe(0);
    expect(doc.categories).toEqual([]);
    expect(doc.totals.allocated).toBe(0);
    expect(doc.totals.spent).toBe(0);
    expect(doc.openingCarryover).toBe(0);
    expect(doc.rolledFromYear).toBeUndefined();

    // timestamps
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  it('supports nested categories and care-item budgets', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const saved = await BudgetYear.create({
      clientId,
      year: 2026,
      annualAllocated: 10_000,
      categories: [
        {
          categoryId,
          categoryName: 'Therapy',
          allocated: 6_000,
          spent: 500,
          items: [
            {
              careItemSlug: 'speech-therapy-initial',
              label: 'Speech Therapy (Initial)',
              allocated: 1_000,
              spent: 200,
            },
            {
              careItemSlug: 'physio-weekly',
              label: 'Physio (Weekly)',
              allocated: 2_000,
              spent: 300,
            },
          ],
        },
      ],
      totals: { allocated: 6_000, spent: 500 },
    });

    expect(saved.categories).toHaveLength(1);
    const cat = saved.categories[0];
    expect(cat.categoryId.toString()).toBe(categoryId.toString());
    expect(cat.items).toHaveLength(2);
    expect(cat.items[0].careItemSlug).toBe('speech-therapy-initial');
    expect(cat.items[0].spent).toBe(200);
    expect(saved.totals.allocated).toBe(6_000);
    expect(saved.totals.spent).toBe(500);
  });

  it('enforces non-negative spent in category and items', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const invalid = new BudgetYear({
      clientId,
      year: 2027,
      categories: [
        {
          categoryId,
          allocated: 100,
          spent: -1, // invalid
          items: [],
        },
      ],
      totals: { allocated: 100, spent: 0 },
    });

    await expect(invalid.validate()).rejects.toThrow();

    const alsoInvalid = new BudgetYear({
      clientId,
      year: 2028,
      categories: [
        {
          categoryId,
          allocated: 100,
          spent: 0,
          items: [
            { careItemSlug: 'x', allocated: 10, spent: -5 },
          ],
        },
      ],
      totals: { allocated: 100, spent: 0 },
    });

    await expect(alsoInvalid.validate()).rejects.toThrow();
  });

  it('enforces unique (clientId, year) via index', async () => {
    const clientId = new mongoose.Types.ObjectId();

    await BudgetYear.create({
      clientId,
      year: 2029,
      totals: { allocated: 0, spent: 0 },
    });

    await expect(
      BudgetYear.create({
        clientId,
        year: 2029,
        totals: { allocated: 0, spent: 0 },
      })
    ).rejects.toThrow();
  });

  it('can update totals and nested item spend', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const by = await BudgetYear.create({
      clientId,
      year: 2030,
      annualAllocated: 5_000,
      categories: [
        {
          categoryId,
          categoryName: 'Equipment',
          allocated: 2_000,
          spent: 0,
          items: [
            {
              careItemSlug: 'wheelchair',
              label: 'Wheelchair',
              allocated: 1_500,
              spent: 0,
            },
          ],
        },
      ],
      totals: { allocated: 2_000, spent: 0 },
    });

    // increment nested spent
    by.categories[0].items[0].spent = 400;
    by.categories[0].spent = 400;
    by.totals.spent = 400;
    await by.save();

    const reloaded = await BudgetYear.findById(by._id).lean();
    expect(reloaded?.totals.spent).toBe(400);
    expect(reloaded?.categories[0].spent).toBe(400);
    expect(reloaded?.categories[0].items[0].spent).toBe(400);
  });
});
