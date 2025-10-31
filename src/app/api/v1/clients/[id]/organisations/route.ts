/**
 * File path: /api/v1/clients/[id]/organisations/route.ts
 * Author: Denise Alexander
 * Date Created: 27/09/2025
 *
 * Purpose: Fetches the organisation history of a client.
 */

export const dynamic = 'force-dynamic';

import '@/models/Organisation';
import Client from '@/models/Client';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// --------- Type Definitions ---------
interface OrgHistoryItem {
  organisation: { _id: string; name: string };
  status: 'pending' | 'approved' | 'revoked';
}

interface ClientDoc {
  organisationHistory: OrgHistoryItem[];
}

/**
 * Retrieves the list of organisations linked to a specific client.
 * @param req
 * @param context
 * @returns JSON array of organisations with status
 */
export async function GET(req: Request, context: { params: { id: string } }) {
  const params = await context.params;
  await connectDB();

  // Finds the client by ID and populates organisation names
  const client = await Client.findById(params.id)
    .select('organisationHistory')
    .populate({
      path: 'organisationHistory.organisation',
      select: 'name',
    })
    .lean<ClientDoc | null>();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Maps the populated organisation history into a simple array for front-end consumption
  const orgs = (client.organisationHistory as OrgHistoryItem[])
    .filter((h) => h.organisation)
    .map((h) => ({
      id: h.organisation._id,
      name: h.organisation.name,
      status: h.status,
    }));

  return NextResponse.json(orgs);
}
