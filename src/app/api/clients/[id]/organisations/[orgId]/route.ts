/**
 * Filename: /clients/[id]/organisations/[orgId]/route.ts
 * Author: Denise Alexander
 * Date Created: 27/09/2025
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import mongoose, { Types } from 'mongoose';
import { Organisation } from '@/models/Organisation';

interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked';
  addedBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export async function POST(
  req: Request,
  context: { params: { id: string; orgId: string } }
) {
  const { id, orgId } = context.params;
  const { action } = await req.json();

  await connectDB();

  // Finds client
  const client = await Client.findById(id);
  if (!client) {
    return NextResponse.json({ error: 'Client not Found.' }, { status: 404 });
  }

  const orgHistory = client.organisationHistory as OrgHistoryItem[];

  // Finds the organisation entry in client's history
  const orgEntry = orgHistory.find((h) => h.organisation.toString() === orgId);
  if (!orgEntry) {
    return NextResponse.json(
      { error: 'Organisation not found for client.' },
      { status: 404 }
    );
  }

  // Performs the requested action
  if (action === 'approve') {
    // Approve access
    orgEntry.status = 'approved';
  } else if (action === 'reject' || action === 'revoke') {
    // Revoke access: removes client from organisation members
    const org = await Organisation.findById(orgId);
    if (org) {
      org.members = org.members.filter(
        (memberId: Types.ObjectId) => memberId.toString() !== id
      );
      await org.save();
    }
    orgEntry.status = 'revoked';
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  // Saves changes to client and returns success message
  await client.save();
  return NextResponse.json({ message: `Organisation ${action}d successfully` });
}
