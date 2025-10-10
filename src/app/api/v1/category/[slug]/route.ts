/**
 * Filename: /app/api/category/[slug]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from '@/models/Category';
import { slugify } from "@/lib/slug";

// Get category by slug so frontend can get specific category
export async function GET(_req: Request, ctx: {params: {slug: string}}) {
    await connectDB();
    const slug = (ctx.params.slug || '').toLowerCase();
    const category = await Category.findOne({slug}).lean();
    if(!category) return NextResponse.json({error: 'Category not found'}, {status: 404});
    return NextResponse.json(category);
}