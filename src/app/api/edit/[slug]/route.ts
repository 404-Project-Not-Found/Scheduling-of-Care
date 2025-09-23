import { NextResponse } from "next/server";
import {connectDB} from "@/app/lib/mongodb"
import Task, {type TaskDoc} from "@/app/models/task";
import {errorJson} from "@/app/lib/task-utils";
import {nextDueISO, generateDueDate, exactSpanDays} from "@/app/lib/date-helper";

type TaskLean = Omit<TaskDoc, keyof Document> & {_id: any};

export const runtime = "nextjs";

export async function GET(_: Request, {params}:{params: {slug: string}}) {
    await connectDB();

    const slug = params.slug.toLowerCase();
    const task = await Task.findOne({slug}).lean<TaskLean | null>();

    if(!task || task.deleted) return errorJson("Task not found", 404);

    const start = (task.dateTo || task.dateFrom) as string | undefined;

    let computed: any = {};
    if(start && task.frequencyCount && task.frequencyUnit) {
        const count = Math.max(1, task.frequencyCount);
        const unit = task.frequencyUnit as "day" | "week" | "month" | "year";

        const next = nextDueISO(start, count, unit);
        const upcoming = generateDueDate(start, count, unit, 6);
        const spanDays = exactSpanDays(start, count, unit);

        computed = {nextDueISO: next, upcomingDueDates: upcoming, exactSpanDaysFromStart: spanDays};
    }

    return NextResponse.json({ ...task, _computed: computed });
}