import {NextResponse, NextRequest } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem from "@/model/CareItem"

export async function POST(req: NextRequest) {
    await connectDB();

    try{
        const body = await req.json();
        const item = await CareItem.create({
            name: body.name,
            frequency: body.frequency,
            startDate: body.startDate,
            category: body.category,
        });

        return NextResponse.json(item,{status: 201});
    } catch(err) {
        console.error(err);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }
}

// ensure route exists -- sanity check
export async function GET() {
    return NextResponse.json({ ok: true, route: "api/add_care_item"});
}