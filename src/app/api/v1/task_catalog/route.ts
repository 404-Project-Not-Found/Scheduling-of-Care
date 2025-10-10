/**
 * Filename: /app/api/task_catalog/route.ts
 * Author: Zahra Rizqita
 * Date Created: 10/10/2025
 * 
 * Computes list of task name for a cateogry
 */
import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem from "@/models/CareItem";
import { slugify } from "@/lib/slug";
import { Task } from "@/context/TaskContext";

export const runtime = "nodejs";

interface TaskCatalogResponse {
  category: string;
  tasks: Array<{ label: string; slug: string }>;
}

function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "").trim();
  if (!category) {
    const empty: TaskCatalogResponse = { category: "", tasks: [] };
    return NextResponse.json(empty);
  }

  
  const labels = await CareItem.distinct("label", {
    category,
    deleted: { $ne: true },
  });

  const seen = new Set<string>();
  const tasks: TaskCatalogResponse["tasks"] = [];
  for (const raw of labels as unknown[]) {
    if (typeof raw !== "string") continue;
    const lbl = raw.trim();
    if (!lbl) continue;
    const norm = lbl.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(norm)) continue;
    seen.add(norm);
    tasks.push({ label: lbl, slug: slugify(lbl) });
  }
  tasks.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  const payload: TaskCatalogResponse = { category, tasks };
  return NextResponse.json(payload);
}