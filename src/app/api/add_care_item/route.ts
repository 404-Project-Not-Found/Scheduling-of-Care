import {NextResponse, NextRequest } from "next/server";
import {connectDB} from "@/lib/mongodb";
import CareItem from "@/model/CareItem"

export async function POST(req: NextRequest) {
    await connectDB();

    try{
        const body = await req.json();
        const item = await CareItem.create(body);

        return NextResponse.json(item,{status: 201});
    } catch(err) {
        console.error(err);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }


}