/**
 * Filename: /management/register_client/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

/**
 * Links a client to the logged-in user's organisation via the client access code.
 * Only authenticated users can perform this action.
 * @param req
 * @returns success upon client registration
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Validates organisation ID
  const orgId = session.user.organisation;
  if (!orgId || !mongoose.isValidObjectId(orgId)) {
    console.log('Invalid orgId:', orgId);
    return NextResponse.json(
      { error: 'Organisation not found or invalid.' },
      { status: 400 }
    );
  }

  // Gets access code from request
  const { accessCode } = await req.json();
  if (!accessCode) {
    return NextResponse.json(
      { error: 'Access code is reuqired.' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    // Finds client by access code
    const client = await Client.findOne({ accessCode: accessCode.trim() });
    if (!client) {
      return NextResponse.json(
        { error: 'No client found with that access code.' },
        { status: 404 }
      );
    }

    // Checks if client is already linked to an organisation
    if (client.organisation && client.status != 'pending') {
      return NextResponse.json(
        { error: 'Client is already linked to an organisation.' },
        { status: 400 }
      );
    }

    // Check if client is already approved
    if (client.status === 'approved') {
      return NextResponse.json(
        { error: 'Client is already approved.' },
        { status: 400 }
      );
    }

    // Link client to the organisation and set status to pending
    client.organisation = new mongoose.Types.ObjectId(orgId);
    client.status = 'pending';
    await client.save();

    // Return success response with client info
    return NextResponse.json({
      message: `Client ${client.name}'s registration is complete and pending family approval.`,
      client: {
        _id: client._id,
        name: client.name,
        accessCode: client.accessCode,
        status: client.status,
      },
    });
  } catch (err) {
    // Catch and log errors
    console.error('Error registering client:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
