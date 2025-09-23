import { NextResponse } from "next/server";
import {connectDB} from "@/app/lib/mongodb";
import Task from "@/app/models/task";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

export const runtime = "nodejs";

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

    const filter: any = {};
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

