/**
 * File path: /models/Budget.ts
 * Author: Zahra Rizqita
 * Date Created: 02/10/2025
 */

import mongoose, { Schema, Types, Model, HydratedDocument } from 'mongoose';

export interface CareItemBudget {
  careItemSlug: string;
  label?: string;
  allocated: number;
  releasedAt?: Date;
  spent: number;
}

export interface CategoryBudget {
  categoryId: Types.ObjectId;
  categoryName?: string;
  allocated: number;
  items: CareItemBudget[];
  releasedAt?: Date;
  spent: number;
}

export interface BudgetTotals {
  spent: number;
  allocated: number;
}

export interface BudgetYearDoc {
  clientId: Types.ObjectId;
  year: number;
  annualAllocated: number;
  surplus: number;
  categories: CategoryBudget[];
  totals: BudgetTotals;
  openingCarryover?: number;
  rolledFromYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CareItemBudgetSchema = new Schema<CareItemBudget>(
  {
    careItemSlug: { type: String, index: true, required: true },
    label: String,
    allocated: { type: Number, default: 0 },
    releasedAt: Date,
    spent: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const CategoryBudgetSchema = new Schema<CategoryBudget>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
      index: true,
    },
    categoryName: String,
    allocated: { type: Number, default: 0 },
    items: { type: [CareItemBudgetSchema], default: [] },
    spent: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const BudgetYearSchema = new Schema<BudgetYearDoc>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    year: { type: Number, required: true, index: true },
    annualAllocated: { type: Number, default: 0 },
    surplus: { type: Number, default: 0 },
    categories: { type: [CategoryBudgetSchema], default: [] },
    totals: {
      spent: { type: Number, default: 0 },
      allocated: { type: Number, default: 0 },
    },
    openingCarryover: { type: Number, default: 0 },
    rolledFromYear: { type: Number, default: undefined },
  },
  { timestamps: true }
);

BudgetYearSchema.index({ clientId: 1, year: 1 }, { unique: true });

export type BudgetYearHydrated = HydratedDocument<BudgetYearDoc>;
export type BudgetYearLean = BudgetYearDoc;
export const BudgetYear: Model<BudgetYearDoc> =
  mongoose.models.BudgetYear ||
  mongoose.model<BudgetYearDoc>('BudgetYear', BudgetYearSchema);
