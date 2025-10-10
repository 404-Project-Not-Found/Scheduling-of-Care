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
import {slugify} from "@/lib/slug";
import {Types} from "mongoose";

interface CreateCareItemBody { 
    clientId?: string; 
    clientName?: string; 
    label: string; 
    status: string; 
    category: string; 
    frequencyCount?: number; 
    frequencyUnit?: 
    string; dateFrom?: 
    string; 
    dateTo?: 
    string; 
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
  const category = searchParams.get("category") || undefined;
  const clientIdStr = searchParams.get("clientId") || undefined;
  const includeDeleted =
    (searchParams.get("includeDeleted") || "false").toLowerCase() === "true";
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "20", 10) || 20,
    100
  );

  const filter: Record<string, unknown> = {};
  if (!includeDeleted) filter.deleted = { $ne: true };
  if (status) filter.status = status;
  if (category) {
    if(!clientIdStr) {
      return NextResponse.json({error: "clientId must be a valid ObjectId"}, {status: 400});
    }
    if(!Types.ObjectId.isValid(clientIdStr)) {
      return NextResponse.json({error: "clientId must be a valid ObjectId(2)"}, {status: 400});
    }
    filter.clientId = new Types.ObjectId(clientIdStr);
    filter.category = category;
  }
  else if (clientIdStr) {
    if(!Types.ObjectId.isValid(clientIdStr)) {
      return NextResponse.json({error: "clientId must be a valid ObjectId(3)"}, {status: 400});
    }
    filter.clientId = new Types.ObjectId(clientIdStr);
  }
  if (q.length > 0) {
    filter.label = {
      $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const tasks = await CareItem.find(filter)
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const response = tasks.map((t) => ({
    label: t.label,
    slug: t.slug,
    frequency: t.frequency ?? "",
    lastDone: t.lastDone ?? "",
    status: t.status,
    category: t.category,
    deleted: Boolean(t.deleted),
    clientId: t.clientId?.toString?.() ?? t.clientId,
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

  if (!label || !status || !categoryInput) {
    return errorJson("label, status and category required", 422);
  }

  // parse client info safely
  const clientName =
    typeof body.clientName === "string" ? body.clientName.trim() : undefined;
  const clientId =
    body.clientId && Types.ObjectId.isValid(body.clientId)
      ? new Types.ObjectId(body.clientId)
      : undefined;

  // ensure or create category
  let categoryId: Types.ObjectId | undefined;
  let normalizedCategory = categoryInput;
  try {
    const categoryDoc = await findOrCreateNewCategory(categoryInput);
    categoryId = categoryDoc._id as Types.ObjectId;
    normalizedCategory = categoryDoc.name;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create category";
    return errorJson(msg, 500);
  }

  // validate date order
  if (
    body.dateFrom &&
    body.dateTo &&
    new Date(body.dateTo) < new Date(body.dateFrom)
  ) {
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
    ...(categoryId ? { categoryId } : {}),
    ...(clientId ? { clientId } : {}),
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
    ...(body.notes ? { notes: body.notes.trim() } : {}),
  };

  try {
    const created = await CareItem.create(payload);
    return NextResponse.json(created, { status: 201 });
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