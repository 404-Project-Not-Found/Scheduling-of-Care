/**
 * Filename: /app/api/care-item/[slug]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 11/10/2025
 * 
 * 
 * Update care item to add comments
 */

import { NextResponse } from 'next/server'; 
import { connectDB } from '@/lib/mongodb';
import CareItem from '@/models/CareItem';



interface CommentBody {
    comment: string;
}

export async function POST(req: Request, {params}: {params: {slug: string}}) {
    await connectDB();
    const {slug} = params;

    let body: CommentBody;
    try {
        body = (await req.json()) as CommentBody;
    } catch {
        return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
    }

    const comment = body.comment?.trim()
    if(!comment) return NextResponse.json({error: ''})
}