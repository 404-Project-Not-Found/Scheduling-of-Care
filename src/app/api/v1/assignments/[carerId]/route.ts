// IMPORTANT: no longer use this endpoint

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function GET(
  _request: NextRequest,
  context: { params: { carerId: string } }
) {
  await connectDB();

  const { carerId } = await context.params;

  if (!carerId) {
    return NextResponse.json({ error: 'Missing carer id.' }, { status: 400 });
  }

  try {
    const assignment = await Assignment.findOne({ carerId }).populate(
      'clientId'
    );

    if (!assignment || !assignment.clientId) {
      return NextResponse.json(
        { message: 'No client found for this carer.' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment.clientId, { status: 200 });
  } catch (err) {
    console.error('Error in GET /api/v1/assignments/[carerId]:', err);
    return NextResponse.json(
      { error: 'Failed to fetch assigned client.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { carerId: string } }
) {
  await connectDB();

  const { carerId } = params;

  if (!carerId) {
    return NextResponse.json({ error: 'Missing carer id.' }, { status: 400 });
  }

  try {
    await Assignment.deleteMany({ carerId });
    return NextResponse.json(
      { message: 'Assignment deleted successfully.' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in DELETE /api/v1/assignments/[carerId]:', err);
    return NextResponse.json(
      { error: 'Failed to delete assignment.' },
      { status: 500 }
    );
  }
}
