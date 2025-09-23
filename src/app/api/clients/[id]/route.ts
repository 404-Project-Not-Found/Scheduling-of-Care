import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  await dbConnect();
  const client = await Client.findById(params.id).lean();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}
