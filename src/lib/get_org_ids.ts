/**
 * File path: /lib/get_org_ids.ts
 * Author: Denise Alexander
 * Date Created: 16/10/2025
 *
 * Purpose: to retrieve a list of organisations the logged-in user has access to.
 * - Management/Carer: their registered organisation.
 * - Family: all organisations their have approved client access to.
 */

import mongoose from 'mongoose';
import Client from '@/models/Client';
import { IUser } from '@/models/User';

// Client's organisation history
interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked';
}

/** Returns list of organisation ids the logged in user has access to
 *
 * - For management/carer users, gets their organisation.
 * - For family users, it retrieves all approved organisations for all their clients.
 */
export async function getOrgIds(user: IUser): Promise<string[]> {
  if (!user?.id) return [];

  // --------------- Management or Carer ---------------
  // These roles belong to a single organisation
  if (user.role === 'management' || user.role === 'carer') {
    if (!user.organisation || !mongoose.isValidObjectId(user.organisation)) {
      return [];
    }
    return [user.organisation.toString()];
  }

  // --------------- Family ---------------
  // Family users may have multiple client organisations
  if (user.role === 'family') {
    // Fetch clients created by the family user
    const clients = await Client.find({ createdBy: user.id })
      .select('organisationHistory')
      .lean<{ organisationHistory: OrgHistoryItem[] }[]>();

    // Collect all approved organisation IDs from clients
    const approvedOrgsIds = clients
      .flatMap((client) => client.organisationHistory || [])
      .filter((entry) => entry.status === 'approved')
      .map((entry) => entry.organisation?.toString());

    // Remove duplicates and invalid entries
    return Array.from(
      new Set(approvedOrgsIds.filter((id): id is string => Boolean(id)))
    );
  }

  return [];
}
