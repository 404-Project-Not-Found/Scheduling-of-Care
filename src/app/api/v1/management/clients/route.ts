/**
 * Filename: /management/clients/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/v1/auth/[...nextauth]/route';

/**
 * Fetches all clients associated with the logged-in user's organisation.
 * Only accessible by users with the `management` role.
 * @returns list of clients
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  // Check if the user is authenticated and has the 'management' role
  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  // Ensure the user has an organisation linked to their account
  if (!session.user.organisation) {
    return NextResponse.json(
      { error: 'No organisation linked to this account.' },
      { status: 400 }
    );
  }

  // Query all clients belonging to the user's organisation
  const clients = await Client.find({
    organisationHistory: {
      $elemMatch: {
        organisation: session.user.organisation,
        status: 'approved',
      },
    },
  }).lean();

  // Return clients as JSON
  return NextResponse.json(clients);
}
