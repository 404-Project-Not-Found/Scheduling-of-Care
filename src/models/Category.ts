/**
 * Filename: /models/Category.ts
 * Author: Zahra Rizqita
 * Date Created: 03/10/2025
 *
 * Schema for category for care items
 */

import mongoose, { Schema, Types, Model } from 'mongoose';

export interface CategoryDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;

  aliases?: string[];
  clientId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  },
  { timestamps: true }
);

// Client each has one category slug
CategorySchema.index({ clientId: 1, slug: 1 }, { unique: true });
type CategoryModel = Model<CategoryDoc>;
const Category = (mongoose.models.Category as CategoryModel) || mongoose.model<CategoryDoc>('Category', CategorySchema);
export default Category;
