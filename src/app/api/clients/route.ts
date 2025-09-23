import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";

// Returns a list of all clients
export async function GET() {
  await dbConnect();
  const clients = await Client.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(clients);
}

// Add a new client
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const { fullName, accessCode, avatarUrl } = body || {};

  if (!fullName || !accessCode) {
    return NextResponse.json(
      { error: "fullName and accessCode are required" },
      { status: 400 }
    );
  }

  const client = await Client.create({
    fullName,
    accessCode,
    avatarUrl: avatarUrl || "",
  });

  return NextResponse.json(client, { status: 201 });
}
