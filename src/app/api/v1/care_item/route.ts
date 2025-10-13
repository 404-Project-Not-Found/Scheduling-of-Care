/**
 * Filename: /app/api/care-item/route.ts
 * Author: Zahra Rizqita
 * Date Created: 24/09/2025
 * Last updated by Zahra Rizqita to connect client to care_item on 11/10/2025
 */

import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem, {CareItemDoc, isUnit} from "@/models/CareItem";
import { 
  toISO,
  parseISODateOnly,
  formatISODateOnly,
  nextDueISO,
  type Unit,
  toISODateOnly
 } from "@/lib/care-item-helpers/date-helpers";
import { findOrCreateNewCategory } from "@/lib/category-helpers";
import {slugify} from "@/lib/slug";
import {Types} from "mongoose";



interface CreateCareItemBody { 
    clientId?: string; 
    clientName?: string; 
    label: string; 
    status: string; 
    category: string; 
    frequencyCount?: number; 
    frequencyUnit?: string; 
    dateFrom?: string; 
    dateTo?: string; 
    notes?: string; 
}


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
export async function GET(req: Request): Promise<NextResponse> {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = searchParams.get("status") || undefined;

  const categoryIdStr = (searchParams.get("categoryId") || "").trim();
  const clientIdStr = (searchParams.get("clientId") || "").trim();
  const categoryName = (searchParams.get("category") || "").trim();

  const includeDeleted = (searchParams.get("includeDeleted") || "false").toLowerCase() === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);

  const filter: Record<string, unknown> = {};
  if (!includeDeleted) filter.deleted = { $ne: true };
  if (status) filter.status = status;
  // Filter by client
  if (clientIdStr) {
    if(!Types.ObjectId.isValid(clientIdStr)) {
      return NextResponse.json({error: "clientId must be a valid ObjectId"}, {status: 400});
    }
    filter.clientId = new Types.ObjectId(clientIdStr);
  }
  // Filter byt category
  if (categoryIdStr) {
    if(!Types.ObjectId.isValid(categoryIdStr)) {
      return NextResponse.json({error: "categoryId must be a valid ObjectId"}, {status: 400});
    }
    filter.categoryId = new Types.ObjectId(categoryIdStr);
  } else if (categoryName) {
    filter.category = categoryName;
  }

  if (q.length > 0) {
    filter.label = {
      $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const tasks = (await CareItem.find(filter)
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean());


  const response = tasks.map((t) => ({
    label: t.label,
    slug: t.slug,
    frequency: t.frequency ?? "",
    lastDone: t.lastDone ?? "",
    status: t.status,
    category: t.category,
    categoryId: t.categoryId?.toString?.() ?? t.categoryId,
    deleted: Boolean(t.deleted),
    clientId: t.clientId?.toString?.() ?? t.clientId,
    frequencyDays: t.frequencyDays ?? undefined,
    frequencyCount: t.frequencyCount ?? undefined, 
    frequencyUnit: t.frequencyUnit ?? undefined, 
    dateFrom: t.dateFrom ?? undefined, 
    dateTo: t.dateTo ?? undefined,
    notes: t.notes ?? "",
  }));

  return NextResponse.json(response);
}


// create a new care item
export async function POST(req: Request): Promise<NextResponse> {
  await connectDB();

  let body: CreateCareItemBody;
  try {
    body = (await req.json()) as CreateCareItemBody;
  } catch {
    return errorJson("Invalid JSON", 400);
  }

  const label = (body.label ?? "").trim();
  const status = (body.status ?? "").trim();
  const categoryInput = (body.category ?? "").trim();
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!label || !status || !categoryInput) {
    return errorJson("label, status and category required", 422);
  }

  if(!body.clientId || !Types.ObjectId.isValid(body.clientId)) return errorJson("Client body must be a valid ObjectId", 422);
  const clientId = new Types.ObjectId(body.clientId);
  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : undefined;
  
  // ensure or create category
  let categoryId: Types.ObjectId | undefined;
  let normalizedCategory = categoryInput;
  try {
    const categoryDoc = await findOrCreateNewCategory({
      clientId, 
      input: categoryInput
    });
    categoryId = categoryDoc._id as Types.ObjectId;
    normalizedCategory = categoryDoc.name;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create category";
    return errorJson(msg, 500);
  }

  // validate date order
  if (body.dateFrom && body.dateTo && new Date(body.dateTo) < new Date(body.dateFrom)) {
    return errorJson("dateTo must be on/after dateFrom", 422);
  }

  const baseSlug = slugify(label);
  const slug = await ensureUniqueSlug(baseSlug);

  const count: number | undefined = Number.isFinite(body.frequencyCount)
    ? Math.max(1, body.frequencyCount!)
    : undefined;
  const unit: string | undefined = body.frequencyUnit?.toLowerCase();

  const hasCount = typeof count === "number" && Number.isFinite(count);
  const hasUnit = hasCount && isUnit(unit);
  const isDayOrWeek = hasUnit && (unit === "day" || unit === "week");

  const dateFromStr: string | undefined = toISO(body.dateFrom);
  const dateToStr: string | undefined = toISO(body.dateTo);

  const payload: Partial<CareItemDoc> = {
    label,
    status,
    category: normalizedCategory,
    categoryId,
    clientId,
    ...(clientName ? { clientName } : {}),
    slug,
    deleted: false,
    ...(hasCount ? { frequencyCount: count } : {}),
    ...(hasUnit ? { frequencyUnit: unit } : {}),
    ...(isDayOrWeek
      ? { frequencyDays: unit === "day" ? count : count! * 7 }
      : {}),
    ...(dateFromStr ? { dateFrom: dateFromStr } : {}),
    ...(dateToStr ? { dateTo: dateToStr } : {}),
    ...(hasUnit
      ? { frequency: `${count} ${unit}${count! > 1 ? "s" : ""}` }
      : {}),
    ...(dateFromStr && dateToStr
      ? { lastDone: `${dateFromStr} to ${dateToStr}` }
      : {}),
    ...(typeof notes === "string" ? {notes} : {}),
  };

  try {
    const created = await CareItem.create(payload);
    return NextResponse.json( 
      {
        _id: created._id,
        label: created.label,
        status: created.status,
        slug: created.slug,
        clientId: created.clientId,
        categoryId: created.categoryId,
        category: created.category,
        notes: created.notes?? "",
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      }, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return errorJson("slug already exists", 409);
    }
    const msg = err instanceof Error ? err.message : "failed to add task";
    return errorJson(msg, 500);
  }
}