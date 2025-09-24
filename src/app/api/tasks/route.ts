import { NextResponse } from "next/server";
import {connectDB} from "@/app/lib/mongodb";
import Task, { TaskDoc } from "@/models/task";


export const runtime = "nodejs";

function slugify(s: string) {
    return s
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") 
        .replace(/\s+/g, "-") 
        .replace(/-+/g, "-") 
        .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(base: string) {
    let slug = base || "task";
    let i = 2;
    while(await Task.exists({slug})) {
       slug = `${base}-${i++}`;
    }
    return slug;
}

function errorJson(message: string, status = 400) {
    return NextResponse.json({error: message}, {status});
}

// GET search list
export async function GET(req: Request) {
    await connectDB();
    const {searchParams} = new URL(req.url);

    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const clientName = searchParams.get("clientName") || undefined;
    const includeDeleted = (searchParams.get("includeDeleted") || "false").toLowerCase() === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);

    const filter: Record<string, unknown> = {};
    if(!includeDeleted) filter.deleted = {$ne: true};
    if(status) filter.status = status;
    if(category) filter.category = category;
    if(clientName) filter.clientName = clientName;

    if(q) filter.label = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const tasks = await Task.find(filter).sort({ updatedAt: -1, createdAt: -1, _id:-1 }).limit(limit).lean();

    return NextResponse.json(tasks.map(t => ({
        label: t.label,
        slug: t.slug,
        frequency: t.frequency || "",
        lastDone: t.lastDone || "",
        status: t.status,
        category: t.category,
        deleted: !!t.deleted, 
    })));
}

// POST creating task
export async function POST(req: Request) {
    await connectDB();

    let body: ;
    try {
        body = await req.json();
    } catch {
        return errorJson("Invalid JSON", 400);
    }

    const label = String(body?.label || "").trim();
    const status = String(body?.status || "").trim();
    const category = String(body?.category || "").trim();
    const clientName = body?.clientName.trim() || undefined;

    if(!label || !status || ! category) {
        return errorJson("label, status and category required", 422);
    }

    if(body?.dateFrom && body?.dateTo && String(body.dateTo) < String(body.dateFrom)) {
        return errorJson("dateTo must be on/after dateFrom", 422);
    }

    const base = slugify(String(body?.slug || label));
    const slug = await ensureUniqueSlug(base);

    const count = Number.isFinite(parseInt(body?.frequencyCount, 10)) ? Math.max(1, parseInt(body.frequencyCount, 10)) : undefined;
    const unit = body?.frequencyUnit?String(body.frequencyUnit).toLowerCase() : undefined;

    const payload: any = {
        label, 
        status, 
        category, 
        clientName, 
        slug,
        frequencyCount: count,
        frequencyUnit: count && unit?unit : undefined,
        frequencyDays: count && (unit === "day" || unit === "week") ? count*(unit === "day" ? 1 : 7) : undefined,
        dateFrom: body?.dateFrom || undefined,
        dateTo: body?.dateTo || undefined, 
        frequency: count && unit ? `${count} ${unit}${count > 1 ? "s" : ""}` : undefined,
        lastDone: body?.dateFrom && body?.dateTo ? `${String(body.dateFrom)} to ${String(body.dateTo)}` : "",
        deleted: false,
    };

    try {
        const created = await Task.create(payload);
        return NextResponse.json(created, {status: 201});
    } catch (err: any) {
        if (err?.code === 11000) return errorJson("slug already exists", 409);
        console.error(err);
        return errorJson(err?.message || "Failed to add task", 500);
    }
}



