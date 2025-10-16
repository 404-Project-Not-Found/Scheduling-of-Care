/**
 * File path: /management/staff/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 *
 * Last Updated by Denise Alexander - 16/10/2025: added logic for family users
 * to view staff list from all organisations they have clients in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { getOrgIds } from '@/lib/get_org_ids';

// Type for staff documents returned from MongoDB
type StaffDoc = {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email?: string;
  role?: 'management' | 'carer';
  status?: 'active' | 'inactive';
  avatarUrl?: string;
  org?: string;
};

// Staff doc with populated organisation
interface PopStaffDoc extends Omit<StaffDoc, 'org'> {
  organisation?: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
}

/**
 * Fetches all staff members for the authenticated user's organisation.
 * Only includes users with roles management or carer.
 * @returns staff list
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const user = session.user as unknown as IUser;
  // For management/carer users, gets their organisation
  // For family users, it retrieves all approved organisations for all their clients
  const orgIds = await getOrgIds(user);

  if (!orgIds.length) {
    return NextResponse.json({ staff: [] }, { status: 200 });
  }

  // Fetches staff members belonging to the organisation
  const staff: StaffDoc[] = await User.find({
    organisation: { $in: orgIds },
    role: { $in: ['management', 'carer'] },
  })
    .select('_id fullName email role status avatarUrl organisation') // only include necessary fields
    .populate<{ organisation: { name: string } }>('organisation', 'name')
    .lean<StaffDoc[]>(); // convert to plain JS object

  // Format the staf data for API response
  const formattedStaff = staff.map((s: PopStaffDoc) => ({
    _id: s._id.toString(), // convert ObjectID to string
    name: s.fullName,
    email: s.email,
    role: s.role,
    // Ensures staff always have a status, default set to 'active'
    status:
      s.status ??
      (['management', 'carer'].includes(s.role || '') ? 'active' : undefined),
    avatarUrl: s.avatarUrl,
    org: s.organisation?.name || '',
  }));

  // Return staff list
  return NextResponse.json({ staff: formattedStaff }, { status: 200 });
}

/**
 * Adds a new staff member to the authenticated user's organisation.
 * @param req
 * @returns newly created staff member
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const data = await req.json();
  await connectDB();

  // Validates organisation ID
  const orgId = session.user.organisation;
  if (!orgId || !mongoose.isValidObjectId(orgId)) {
    console.log('Invalid orgId:', orgId);
    return NextResponse.json(
      { error: 'Organisation not found or invalid.' },
      { status: 400 }
    );
  }

  try {
    // Create new staff member in MongoDB
    const newStaff = await User.create({
      ...data,
      organisation: orgId,
      status: data.status ?? 'active',
    });

    // Return newly created staff member
    return NextResponse.json(
      {
        _id: newStaff._id,
        name: newStaff.fullName,
        email: newStaff.email,
        role: newStaff.role,
        status: newStaff.status,
        avatarUrl: newStaff.avatarUrl,
        org: newStaff.organisation?.name || '',
      },
      { status: 201 }
    );
  } catch (err) {
    // Handle errors
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
