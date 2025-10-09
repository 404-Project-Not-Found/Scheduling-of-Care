/**
 * Filename: /app/api/care-item/[slug]/route.ts
 * Author: Zahra Rizqita
 * Date Created: 24/09/2025
 */

import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem, {type CareItemDoc} from "@/models/CareItem";
import {normaliseCareItemPayLoad, errorJson} from "@/lib/care-item-helpers/care_item_utils";

export const runtime = "nodejs";

// get one care item by slug
export async function GET(_: Request, ctx: {params: Promise<{slug: string}>}) {
    await connectDB();
    const {slug} = await ctx.params;
    const task = await CareItem.findOne({ slug: slug.toLowerCase() }).lean<CareItemDoc|null>();
    if (!task || task.deleted) return errorJson("Task not found", 404);
    return NextResponse.json(task);
}

// update one care item
export async function PUT(req: Request, ctx:{params: Promise<{slug: string}>}) {
    await connectDB();

    const {slug} = await ctx.params;
    const body = await req.json();
    const payload = normaliseCareItemPayLoad(body);

    const updated = await CareItem.findOneAndUpdate(
        {slug: slug.toLowerCase()},
        {$set: payload},
        {new: true}
    ).lean();

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json(updated);
}

// soft delete one care item
export async function DELETE(_: Request, ctx:{params: Promise<{slug: string}>}) {
    await connectDB();

    const {slug} = await ctx.params;

    const updated = await CareItem.findOneAndUpdate(
        {slug: slug.toLowerCase()},
        {$set: {deleted: true}},
        {new: true}
    );

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json({ok: true, slug: slug, deleted: true});
}