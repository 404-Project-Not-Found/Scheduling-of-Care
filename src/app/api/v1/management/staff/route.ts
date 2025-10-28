/**
 * File path: /api/v1/management/staff/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 *
 * Purpose: Handles staff list for all users.
 * - Management: can add new staff and delete staff members from their organisation staff lists.
 * - Family: view staff list of every organisation they have a client in.
 * - Carer: view staff list for their organisation.
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
import { sanitizeAvatarUrl } from '@/lib/image-upload';

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
    avatarUrl: sanitizeAvatarUrl(s.avatarUrl), // Replace base64 with default
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
        avatarUrl: sanitizeAvatarUrl(newStaff.avatarUrl), // Replace base64 with default
        org: newStaff.organisation?.name || '',
      },
      { status: 201 }
    );
  } catch (err) {
    // Handle errors
    return NextResponse.json({ error: err }, { status: 400 });
  }
}

/**
 * Deletes the staff users account completely
 * @param req
 * @returns success message
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('id');

  if (!staffId || !mongoose.isValidObjectId(staffId)) {
    return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
  }

  try {
    const removed = await User.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(staffId),
      organisation: session.user.organisation,
    });

    if (!removed) {
      return NextResponse.json(
        { error: 'Staff not found or not in organisation' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Staff removed successfully!' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error removing staff:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
