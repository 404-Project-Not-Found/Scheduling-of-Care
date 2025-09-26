/**
 * Filename: /management/staff/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function GET() {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

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

  const staff = await User.find({ organisationId: orgId }).lean();

  return NextResponse.json(staff);
}

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
    const newStaff = await User.create({
      ...data,
      organisationId: orgId,
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
