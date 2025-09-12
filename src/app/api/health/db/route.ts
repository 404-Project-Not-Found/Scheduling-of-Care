import { NextResponse } from "next/server";
import {getDb} from "@/lib/mongodb";

export async function GET() {
    const db = await getDb();
    const ping = await db.command({ping: 1});
    return NextResponse.json({ok : ping.ok == 1});
}