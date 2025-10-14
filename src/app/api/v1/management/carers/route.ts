// IMPORTANT: no longer use this endpoint

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Carer from '@/models/Carer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  if (!session.user.organisation) {
    return NextResponse.json(
      { error: 'No organisation linked to this account.' },
      { status: 400 }
    );
  }

  const carers = await Carer.find({
    organisation: session.user.organisation,
  }).lean();

  return NextResponse.json(carers, { status: 200 });
}
