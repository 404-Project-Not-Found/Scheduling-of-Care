import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import Carer from '@/models/Carer';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  const { carerId, clientId } = await request.json();

  if (!carerId || !clientId) {
    return NextResponse.json(
      { error: 'Missing carer id and client id.' },
      { status: 400 }
    );
  }

  const carer = await Carer.findOne({
    _id: carerId,
    organisation: session.user.organisation,
  });

  if (!carer) {
    return NextResponse.json(
      { error: 'Carer not found or does not belong to your organisation.' },
      { status: 404 }
    );
  }

  const client = await Client.findOne({
    _id: clientId,
    'organisationHistory.organisation': session.user.organisation,
  });

  if (!client) {
    return NextResponse.json(
      { error: 'Client not found or does not belong to your organisation.' },
      { status: 404 }
    );
  }

  await Assignment.deleteMany({ carerId });

  const newAssignment = await Assignment.create({
    carerId,
    clientId,
  });

  return NextResponse.json(newAssignment, { status: 201 });
}
