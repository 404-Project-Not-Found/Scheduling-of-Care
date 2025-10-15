/**
 * File path: /management/staff/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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

interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked';
}

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

  await connectDB();

  let orgIds: string[] = [];

  // Validates organisation ID
  if (session.user.role === 'management' || session.user.role === 'carer') {
    const orgId = session.user.organisation;
    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      return NextResponse.json(
        { error: 'Organisation not found or invalid.' },
        { status: 400 }
      );
    }
    orgIds = [orgId];
  } else if (session.user.role === 'family') {
    const clients = await Client.find({ createdBy: session.user.id })
      .select('organisationHistory')
      .lean<
        {
          organisationHistory: OrgHistoryItem[];
        }[]
      >();

    const approvedOrgsIds = clients.flatMap((client) =>
      (client.organisationHistory || [])
        .filter((entry) => entry.status === 'approved')
        .map((entry) => entry.organisation?.toString())
    );

    orgIds = Array.from(
      new Set(approvedOrgsIds.filter((id): id is string => Boolean(id)))
    );

    if (!orgIds.length) {
      return NextResponse.json({ staff: [] }, { status: 200 });
    }
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
