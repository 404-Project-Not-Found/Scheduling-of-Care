/**
 * File path: /models/Budget.ts
 * Author: Zahra Rizqita
 * Date Created: 02/10/2025
 */

import { Schema, model, models } from 'mongoose';

export type BudgetRow = {
  item: string;
  category: string;
  allocated: number;
  spent: number;
};

const BudgetSchema = new Schema(
  {
    careItemId: {type: String},
    categoryId: {type: String},
    allocated: {type: Number, min: 1},
    spent: {type: Number, min: 1}
  },
  { timestamps: true }
);