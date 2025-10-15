import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Shift from '@/models/Shift';
import User from '@/models/User';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked';
}

interface ShiftPopulated {
  _id: mongoose.Types.ObjectId;
  staff: {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    role: string;
  };
  date: string;
  start: string;
  end: string;
  label?: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  let orgIds: string[] = [];

  if (session.user.role === 'management' || session.user.role === 'carer') {
    if (
      !session.user.organisation ||
      !mongoose.isValidObjectId(session.user.organisation)
    ) {
      return NextResponse.json(
        { error: 'Organisation not found or invalid.' },
        { status: 400 }
      );
    }
    orgIds = [session.user.organisation];
  } else if (session.user.role === 'family') {
    const clients = await Client.find({ createdBy: session.user.id })
      .select('organisationHistory')
      .lean<{ organisationHistory: OrgHistoryItem[] }[]>();

    const approvedOrgsIds = clients.flatMap((client) =>
      (client.organisationHistory || [])
        .filter((entry) => entry.status === 'approved')
        .map((entry) => entry.organisation?.toString())
    );

    orgIds = Array.from(
      new Set(approvedOrgsIds.filter((id): id is string => Boolean(id)))
    );

    if (!orgIds.length) {
      return NextResponse.json({ staff: [], shifts: [] }, { status: 200 });
    }
  }

  const shifts = await Shift.find({ organisation: { $in: orgIds } })
    .populate<{
      staff: { _id: mongoose.Types.ObjectId; fullName: string; role: string };
    }>('staff', 'fullName role')
    .lean<ShiftPopulated[]>();

  const formattedShifts = shifts.map((s) => ({
    id: s._id.toString(),
    staffId: s.staff._id.toString(),
    staffName: s.staff.fullName,
    role: s.staff.role,
    date: s.date,
    start: s.start,
    end: s.end,
    label: s.label,
  }));

  return NextResponse.json({ shifts: formattedShifts }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ message: 'Unauthorised' }, { status: 403 });
  }

  await connectDB();

  const orgId = session.user.organisation;
  const { staffId, date, start, end, label } = await req.json();

  if (!staffId || !date || !start || !end) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  const staffObjId = new mongoose.Types.ObjectId(staffId);

  const staff = await User.findOne({ _id: staffObjId, organisation: orgId });
  if (!staff) {
    return NextResponse.json(
      { message: 'Staff not found in organisation' },
      { status: 400 }
    );
  }

  try {
    const updated = await Shift.findOneAndUpdate(
      { organisation: orgId, staff: staffObjId, date },
      { organisation: orgId, staff: staffObjId, date, start, end, label },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json(
      { message: 'Shift created/updated', updated },
      { status: 200 }
    );
  } catch (err) {
    console.error('Shift save error:', err);
    return NextResponse.json(
      { message: 'Error saving shift' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ message: 'Unauthorised' }, { status: 403 });
  }
  await connectDB();

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staffId');
  const date = searchParams.get('date');

  if (!staffId || !date) {
    return NextResponse.json(
      { message: 'Missing required fields.' },
      { status: 400 }
    );
  }

  await Shift.findOneAndDelete({
    organisation: session.user.organisation,
    staff: new mongoose.Types.ObjectId(staffId),
    date,
  });

  return NextResponse.json({ message: 'Shift deleted.' }, { status: 200 });
}
