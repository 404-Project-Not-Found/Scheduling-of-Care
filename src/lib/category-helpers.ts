/**
 * Filename: /lib/category_helpers.ts
 * Author: Zahra Rizqita
 * Date Created: 03/10/2025
 */

import { Types } from 'mongoose';
import Category from '@/models/Category';
import { slugify } from './slug';

/** Function to find or create category - client-scoped
 * @param params.clientId - client's ObjectID
 * @param params.input - category name inputted
 * @returns Existing or newly created Category document
 * */
export async function findOrCreateNewCategory(params: {
  clientId: Types.ObjectId;
  input: string;
}) {
  const { clientId, input } = params;
  const name = input.trim();
  if (!name) throw new Error('Category name required');

  const slug = slugify(name);

  const doc = await Category.findOneAndUpdate(
    { clientId, slug },
    { $setOnInsert: { name: slug, clientId } },
    { new: true, upsert: true }
  );

  if (!doc) throw new Error('Failed to create of fetch category');

  return doc;
}
