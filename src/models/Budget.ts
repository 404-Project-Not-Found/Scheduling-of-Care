/**
 * File path: /models/Budget.ts
 * Author: Zahra Rizqita
 * Date Created: 02/10/2025
 */

import { Schema, model, models, Types } from 'mongoose';

const CareItemBudgetSchema = new Schema(
  {
    careItemSlug: {type: String, index: true, required: true},
    label: String,
    allocated: {type: String, default: 0},
    releasedAt: Date,
  },
  {_id: false}
);

const CategoryBudgetSchema = new Schema(
  {
    categoryId: {type: Schema.Types.ObjectId, required: true, ref: 'Category', index: true},
    categoryName: String,
    allocated: {type: Number, default: 0},
    items: {type: [CareItemBudgetSchema], default: []},
    spent: {type: Number, min: 1},
  },
  { _id: false }
);

const BudgetYearSchema = new Schema(
  {
    clientId: {type: Schema.Types.ObjectId, required: true, ref: 'Client', index: true},
    year: {type: Number, required: true, index: true},
    annualAllocated: {type: Number, default: 0},
    surplus: {type: Number, default: 0},
    categories: {type: [CategoryBudgetSchema], default: []},
    totals: {
      spent: {type: Number, default: 0},
      allocated: {type: Number, default: 0},
    },
  }, 
  {timestamps: true}
);

BudgetYearSchema.index({clientId: 1, year: 1}, {unique: true});

export const BudgetYear = models.BudgetYear || model('BudgetYear', BudgetYearSchema);