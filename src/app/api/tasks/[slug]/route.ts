import { NextResponse } from "next/server";
import {connectDB} from "@/app/lib/mongodb";
import Task, {type TaskDoc} from "@/app/models/task";
import {normaliseTaskPayLoad, errorJson} from "@/app/lib/task-utils";

export const runtime = "nodejs";

export async function GET(_: Request, {params}: {params: {slug: string}}) {
    await connectDB();
    const task = await Task.findOne({ slug: params.slug.toLowerCase() }).lean<TaskDoc|null>();
    if (!task || task.deleted) return errorJson("Task not found", 404);
    return NextResponse.json(task);
}

export async function PUT(req: Request, {params}: {params: {slug: string}}) {
    await connectDB();
    const body = await req.json();
    const payload = normaliseTaskPayLoad(body);

    const updated = await Task.findOneAndUpdate(
        {slug: params.slug.toLowerCase()},
        {$set: payload},
        {new: true}
    ).lean();

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json(updated);
}

export async function DELETE(_: Request, {params}: {params: {slug: string}}) {
    await connectDB();
    const updated = await Task.findOneAndUpdate(
        {slug: params.slug.toLowerCase()},
        {$set: {deleted: true}},
        {new: true}
    );

    if(!updated) return errorJson("Task not found", 404);
    return NextResponse.json({ok: true, slug: params.slug, deleted: true});
}