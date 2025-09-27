/**
 * Filename: /family_dashboard/manage_organisation_access/[clientId]/page.tsx
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 */

import Client from '@/models/Client';
import { connectDB } from '@/lib/mongodb';
import '@/models/Organisation'; // Ensures the Organisation model is registered with Mongoose
import ManageAccessInner from './ManageAccessInner';

type OrgStatus = 'active' | 'pending' | 'revoked';

interface PopulatedOrgHistoryItem {
  organisation: { _id: string; name: string };
  status: 'pending' | 'approved' | 'revoked';
}

// Optional: keep dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ManageAccessPage({
  params,
}: {
  params: { clientId: string };
}) {
  const clientId = params.clientId;
  await connectDB();

  // Fetches client document and populates organisation names from organisationHistory
  const clientDoc = await Client.findById(clientId).populate({
    path: 'organisationHistory.organisation',
    model: 'Organisation',
  });

  // Renders a simple message
  if (!clientDoc) {
    return <div>Client not found</div>;
  }

  // Map populates data into plain JS object with fields suitable for ManageAccessInner
  const plainClient = {
    id: clientDoc._id.toString(),
    name: clientDoc.name,
    organisationHistory: (
      clientDoc.organisationHistory as PopulatedOrgHistoryItem[]
    ).map((item) => ({
      id: item.organisation._id.toString(),
      name: item.organisation.name,
      status: (item.status === 'approved'
        ? 'active'
        : item.status) as OrgStatus,
    })),
  };

  // Render the inner component with client and organisation data
  return (
    <ManageAccessInner
      client={{ id: plainClient.id, name: plainClient.name }}
      initialOrgs={plainClient.organisationHistory}
    />
  );
}
