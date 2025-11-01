/**
 * File path: /api/v1/shifts/route.ts
 * Author: Denise Alexander
 * Date Created: 15/10/2025
 *
 * Purpose: Handles shift management.
 * - Management: can add/update/delete shifts.
 * - Family: can view staff shifts for all organisations they have approved client access to.
 * - Carer: can view their shifts + other staff members shifts from their organisation.
 */

import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Shift from '@/models/Shift';
import User, { IUser } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { getOrgIds } from '@/lib/get_org_ids';

// Type for populated shift documents returned to DB
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

/**
 * Fetches shifts for the authenticated user's organisations
 * @returns staff shifts
 */
export async function GET() {
  // Ensures the user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
  }

  const user = session.user as unknown as IUser;
  // For management/carer users, gets their organisation
  // For family users, it retrieves all approved organisations for all their clients
  const orgIds = await getOrgIds(user);

  if (!orgIds.length) {
    return NextResponse.json({ staff: [], shifts: [] }, { status: 200 });
  }

  // Fetch all shifts for the organisations
  const shifts = await Shift.find({ organisation: { $in: orgIds } })
    .populate<{
      staff: { _id: mongoose.Types.ObjectId; fullName: string; role: string };
    }>('staff', 'fullName role')
    .lean<ShiftPopulated[]>();

  // Formatted shifts for API response
  const formattedShifts = shifts
    .filter((s) => s.staff)
    .map((s) => ({
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

/**
 * Create or update a shift
 * @param req
 * @returns succes message
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Make sure the user is management
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

  // Ensure staff belongs to the organisation
  const staff = await User.findOne({ _id: staffObjId, organisation: orgId });
  if (!staff) {
    return NextResponse.json(
      { message: 'Staff not found in organisation' },
      { status: 400 }
    );
  }

  try {
    // Upsert the shift: create if it doesn't exist or update if it does exist
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

/**
 * Delete shift
 * @param req
 * @returns successful deletion message
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Make sure user is management
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

  // Delete the shift
  await Shift.findOneAndDelete({
    organisation: session.user.organisation,
    staff: new mongoose.Types.ObjectId(staffId),
    date,
  });

  return NextResponse.json({ message: 'Shift deleted.' }, { status: 200 });
}
