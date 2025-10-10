/**
 * Filename: /app/api/category/route.ts
 * Author: Zahra Rizqita
 * Date Created: 05/10/2025
 */

import {NextResponse} from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { findOrCreateNewCategory } from '@/lib/category-helpers';

export const runtime = 'nodejs';

// Search through categories
export async function GET(req: Request) {
    await connectDB();
    const {searchParams} = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    const filter = q ? {
        $or: [
            { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
            { aliases: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ],
    } : {};

    const list = await Category.find(filter).sort({name: 1}).limit(200).lean();
    return NextResponse.json(
        list.map((c) => ({
            name: c.name,
            slug: c.slug,
            aliases: c.aliases ?? [],
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }))
    );
}

// Create a new category or reuse existing one if have the same name
export async function POST(req: Request) {
    await connectDB();
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
    }

    const input = typeof(body as {name?: unknown}).name === 'string' ? (body as {name: string}).name.trim() : '';
    if(!input) return NextResponse.json({error: 'Category name required'}, {status: 422});

    try{
        const category = await findOrCreateNewCategory(input);
        return NextResponse.json(category, {status: 201});
    } catch (e) {
        const msg = e instanceof Error ? e.message: 'Failed to create category';
        return NextResponse.json({error: msg}, {status: 500});
    }
}