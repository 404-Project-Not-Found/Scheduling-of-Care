/**
 * Filename: /app/api/tasks/[slug]/route.ts
 * Author: Zahra Rizqita
 */

import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import Task, {type TaskDoc} from "@/models/task";
import {normaliseTaskPayLoad, errorJson} from "@/lib/task-utils";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: {params: Promise<{slug: string}>}) {
    await connectDB();
    const {slug} = await ctx.params;
    const task = await Task.findOne({ slug: slug.toLowerCase() }).lean<TaskDoc|null>();
    if (!task || task.deleted) return errorJson("Task not found", 404);
    return NextResponse.json(task);
}

export async function PUT(req: Request, ctx:{params: Promise<{slug: string}>}) {
    await connectDB();

    const {slug} = await ctx.params;
    const body = await req.json();
    const payload = normaliseTaskPayLoad(body);

    const updated = await Task.findOneAndUpdate(
        {slug: slug.toLowerCase()},
        {$set: payload},
        {new: true}
    ).lean();

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx:{params: Promise<{slug: string}>}) {
    await connectDB();

    const {slug} = await ctx.params;

    const updated = await Task.findOneAndUpdate(
        {slug: slug.toLowerCase()},
        {$set: {deleted: true}},
        {new: true}
    );

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json({ok: true, slug: slug, deleted: true});
}