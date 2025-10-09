/**
 * Filename: /app/api/care-item/route.ts
 * Author: Zahra Rizqita
 * Date Created: 24/09/2025
 * Updated at 05/09/2025
 */

import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem, {CareItemDoc, isUnit} from "@/models/CareItem";
import { toISO } from "@/lib/care-item-helpers/date-helpers";
import { findOrCreateNewCategory } from "@/lib/category-helpers";
import {slugify} from "@/lib/slug"



async function ensureUniqueSlug(base: string) {
    let slug = base || "task";
    let i = 2;
    while(await CareItem.exists({slug})) {
       slug = `${base}-${i++}`;
    }
    return slug;
}

function errorJson(message: string, status = 400) {
    return NextResponse.json({error: message}, {status});
}

// fetch a list of care items
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

    const tasks = await CareItem.find(filter).sort({ updatedAt: -1, createdAt: -1, _id:-1 }).limit(limit).lean();

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

// create a new care item
export async function POST(req: Request) {
    await connectDB();

    let body: CareItemDoc;
    try {
        body = await req.json();
    } catch {
        return errorJson("Invalid JSON", 400);
    }

    const label = String(body?.label || "").trim();
    const status = String(body?.status || "").trim();
    const category = String(body?.category || "").trim();
    const clientName = body?.clientName.trim();

    if(!label || !status || ! category) {
        return errorJson("label, status and category required", 422);
    }

    if(body?.dateFrom && body?.dateTo && String(body.dateTo) < String(body.dateFrom)) {
        return errorJson("dateTo must be on/after dateFrom", 422);
    }

    const base = slugify(String(body?.slug || label));
    const slug = await ensureUniqueSlug(base);

    const count = Number.isFinite(body?.frequencyCount) ? Math.max(1, body.frequencyCount): undefined;
    const unit = body?.frequencyUnit?String(body.frequencyUnit).toLowerCase() : undefined;

    const hasCount = typeof count === "number" && Number.isFinite(count);
    const hasUnit = hasCount && isUnit(unit);
    const isDayOrWeek = hasUnit && (unit === "day" || unit == "week");

    const dateFromStr = toISO(body?.dateFrom);
    const dateToStr = toISO(body?.dateTo);

    const payload = {
        label, 
        status, 
        category, 
        clientName, 
        slug,
        deleted: false,
        ...(hasCount ? { frequencyCount: count } : {}),
        ...(hasUnit ? { frequencyUnit: unit } : {}),
        ...(isDayOrWeek ? {frequencyDays: unit === "day" ? count: count*7} : {}),
        ...(dateFromStr ? { dateFrom: dateFromStr } : {}), 
        ...(dateToStr   ? { dateTo:   dateToStr}   : {}),
        ...(hasUnit ? { frequency: `${count} ${unit}${count! > 1 ? "s" : ""}` } : {}),
        ...(dateFromStr && dateToStr ? { lastDone: `${dateFromStr} to ${dateToStr}` } : {}),
    } satisfies Partial<CareItemDoc>;

    try {
        const created = await CareItem.create(payload);
        return NextResponse.json(created, {status: 201});
    } catch (err: unknown) {
        if (typeof err === "object" && err && "code" in err) { 
            if ((err as { code?: number }).code === 11000) { 
                return errorJson("slug already exists", 409); 
            } 
        }
        console.error(err);
        return errorJson(
            err instanceof Error? err.message: "failed to add task", 500
        );
    }
}