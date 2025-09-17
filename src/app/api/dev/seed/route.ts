import { NextResponse } from "next/server";
import { upsertUser } from "@/data/users";

export async function POST() { 
    await upsertUser({ _id: "1", email: "management@example.com", role: "MANAGEMENT" });
    await upsertUser({ _id: "2", email: "carer@example.com", role: "CARER" });
    await upsertUser({ _id: "3", email: "familyLegal@example.com", role: "FAMILY_LEGAL" });
    return NextResponse.json({ seeded: true });
}
