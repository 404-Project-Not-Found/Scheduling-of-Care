/**
 * Filename: /app/api/category/[slug]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 * Updated on 10/10/2025 -- category is scoped by client
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { Types } from 'mongoose';
import { slugify } from '@/lib/slug';

// Get category by slug so frontend can get specific category -- updated to scope for client
export async function GET(req: Request, ctx: { params: { slug: string } }) {
  await connectDB();
  const slug = (ctx.params.slug || '').toLowerCase();
  const { searchParams } = new URL(req.url);
  const clientIdrStr = (searchParams.get('clientId') || '').trim();

  if (!clientIdrStr || !Types.ObjectId.isValid(clientIdrStr)) {
    return NextResponse.json(
      { error: 'clientId must be a valid ObjectId - route.ts' },
      { status: 422 }
    );
  }

  const clientId = new Types.ObjectId(clientIdrStr);
  const category = await Category.findOne({ clientId, slug }).lean();

  if (!category)
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  return NextResponse.json(category);
}
