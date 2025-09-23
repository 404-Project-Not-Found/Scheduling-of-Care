import {NextResponse} from "next/server";
import type {Unit} from "@/app/models/task";
import { parseLegacyFrequency } from "./legacy";

// Days in a day and a week always same unlike a month and a year
const unitDayWeekSame: Record<Extract<Unit, "day"|"week">, number> = {day: 1, week: 7}; 

export function normaliseTaskPayLoad(body: any) {
    let {frequencyCount, frequencyUnit, frequencyDays, frequency, dateFrom, dateTo} = body;

    if(typeof frequencyCount === "number" && frequencyUnit) {
        const unit = String(frequencyUnit).toLowerCase() as Unit;
        const count = Math.max(1, Math.floor(frequencyCount));

        if(unit === "day" || unit === "week") {
            frequencyDays = count*unitDayWeekSame[unit];
        } else {
            frequencyDays = undefined;
        }

        frequency = `${count} ${unit}${count > 1 ? "s" : ""}`;
        frequencyCount = count;
        frequencyUnit = unit;

    } else if(frequency) {
        const parsed = parseLegacyFrequency(frequency)
        if(parsed) {
            frequencyCount = parsed.count;
            frequencyUnit = parsed.unit;
            frequencyDays = parsed.unit === "day"?parsed.count: parsed.unit === "week"?parsed.count*7: undefined;
        } 

    } else if (typeof frequencyDays === "number") {
        const count = Math.max(1, Math.floor(frequencyDays));
        frequencyCount = count;
        frequencyUnit = "day";
        frequency = `${count} day${count > 1 ? "s" : ""}`;
    }

    const lastDone = dateFrom && dateTo ? `${String(dateFrom).trim()} to ${String(dateTo).trim()}` : body.lastDone || "";

    return {...body, frequencyCount, frequencyUnit, frequencyDays, frequency, lastDone};
}

export function errorJson(message: String, status=400) {
    return NextResponse.json({error: message}, {status});
}

