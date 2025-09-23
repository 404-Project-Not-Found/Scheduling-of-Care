import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET() {
  await connectDB();
  const clients = await Client.find();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const data = await req.json();
  try {
    const client = await Client.create(data);
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
