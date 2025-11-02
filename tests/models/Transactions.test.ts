import mongoose from 'mongoose';
import { connect, clearDatabase, closeDatabase } from '../set_up/db';
import { Transaction } from '@/models/Transaction';

beforeAll(async () => {
  await connect();
  await Transaction.init();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Transaction Model', () => {
  it('creates a purchase with one line and normalizes careItemSlug', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const tx = await Transaction.create({
      clientId,
      year: 2025,
      date: new Date('2025-10-28T00:00:00Z'),
      type: 'Purchase',
      madeByUserId: userId,
      lines: [
        {
          categoryId,
          careItemSlug: 'Physio-Weekly',
          amount: 120,
          label: 'Physio (Weekly)',
        },
      ],
      note: 'Initial purchase',
    });

    expect(tx._id).toBeDefined();
    expect(tx.type).toBe('Purchase');
    expect(tx.lines).toHaveLength(1);
    expect(tx.lines[0].careItemSlug).toBe('physio-weekly'); // lowercased
    expect(tx.lines[0].amount).toBe(120);
    expect(tx.createdAt).toBeInstanceOf(Date);
  });

  it('fails validation if lines are empty', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const invalid = new Transaction({
      clientId,
      year: 2025,
      date: new Date(),
      type: 'Purchase',
      madeByUserId: userId,
      lines: [],
    });

    await expect(invalid.validate()).rejects.toThrow(
      /At least one line required/
    );
  });

  it('fails validation if amount is negative', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const invalid = new Transaction({
      clientId,
      year: 2025,
      date: new Date(),
      type: 'Purchase',
      madeByUserId: userId,
      lines: [{ categoryId, careItemSlug: 'x', amount: -1 }],
    });

    await expect(invalid.validate()).rejects.toThrow();
  });

  it('creates a refund referencing a previous purchase and line', async () => {
    const clientId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    const purchase = await Transaction.create({
      clientId,
      year: 2025,
      date: new Date('2025-10-28T00:00:00Z'),
      type: 'Purchase',
      madeByUserId: userId,
      lines: [
        { categoryId, careItemSlug: 'test-item', amount: 200, label: 'Item' },
      ],
    });

    const lineId = purchase.lines[0]._id;

    const refund = await Transaction.create({
      clientId,
      year: 2025,
      date: new Date('2025-10-29T00:00:00Z'),
      type: 'Refund',
      madeByUserId: userId,
      lines: [
        {
          categoryId,
          careItemSlug: 'test-item',
          amount: 200,
          refundOfTransId: purchase._id,
          refundOfLineId: lineId,
        },
      ],
      note: 'Full refund',
    });

    expect(refund.type).toBe('Refund');
    expect(refund.lines[0].refundOfTransId?.toString()).toBe(
      purchase._id.toString()
    );
  });

  it('exposes expected indexes', async () => {
    const idx = await Transaction.collection.indexes();
    const byClientYearDate = idx.find(
      (i) => i.key.clientId === 1 && i.key.year === 1 && i.key.date === 1
    );
    const byCYCT = idx.find((i) => i.name === 'byClientYearCategoryType');
    const byCYV = idx.find((i) => i.name === 'byClientYearVoided');

    expect(byClientYearDate).toBeDefined();
    expect(byCYCT?.key).toEqual({
      clientId: 1,
      year: 1,
      'lines.categoryId': 1,
      type: 1,
    });
    //expect(byCYCT?.partialFilterExpression).toEqual({ voidedAt: { $eq: null} });
    expect(byCYV?.key).toEqual({ clientId: 1, year: 1, voidedAt: 1 });
  });
});
