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

interface TaskCatalogueResponse {
    category: string;
    tasks: Array<{label: string; slug: string}>;
}

function errorJson(message: string, status = 400) {
    return NextResponse.json({error: message}, {status});
}

// Find all care items name for a category
export async function GET(req: Request) {
    await connectDB();
    const {searchParams} = new URL(req.url);
    const category = (searchParams.get("category") || "").trim();
    
    if(!category) {
        const empty: TaskCatalogueResponse = {category: "", tasks: []};
        return NextResponse.json(empty);
    }

    const labels = await CareItem.distinct("label", {
        category,
        deleted: {$ne: true},
    });

    const cleanLabels = (labels as unknown[]).filter((x) : x is string => typeof x === "string" && x.trim().length > 0);

    cleanLabels.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));

    const tasks = cleanLabels.map((label) => ({label, slug: slugify(label)}));
    const payload: TaskCatalogueResponse = {category, tasks};
    return NextResponse.json(payload);
}