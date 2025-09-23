import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accessCode = url.searchParams.get('accessCode');

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Missing access code' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingClient = await Client.findOne({ accessCode });

    return NextResponse.json({
      exists: existingClient,
      client: existingClient
        ? {
            name: existingClient.name,
            dob: existingClient.dob,
            notes: existingClient.notes,
            avatarUrl: existingClient.avatarUrl,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
