import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Client from '@/models/Client';
import User from '@/models/User';
import mongoose from 'mongoose';

interface AccessUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'family' | 'management' | 'carer';
}

interface LeanClient {
  _id: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: 'family' | 'carer' | 'management';
  };
  organisationHistory?: {
    status: 'pending' | 'approved' | 'revoked';
    organisation?: {
      _id: string;
      name: string;
    };
  }[];
}

interface OrganisationHistoryItem {
  status: 'pending' | 'approved' | 'revoked';
  organisation?: {
    _id: string;
    name: string;
  };
}

export async function GET(
  req: NextRequest,
  context: { params?: { id?: string } }
) {
  await connectDB();

  const params = await Promise.resolve(context.params);
  const clientId = params?.id;
  if (!clientId) return NextResponse.json([], { status: 200 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const client = (await Client.findById(clientId)
      .populate('createdBy', 'fullName email role')
      .populate({
        path: 'organisationHistory.organisation',
        select: 'name',
      })
      .lean()) as LeanClient | null;

    if (!client) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const accessUsers: AccessUser[] = [];

    if (client.createdBy) {
      accessUsers.push({
        _id: client.createdBy._id.toString(),
        fullName: client.createdBy.fullName,
        email: client.createdBy.email,
        role: 'family',
      });
    }

    const approvedOrgIds: string[] =
      client.organisationHistory
        ?.filter((h) => h.status === 'approved' && h.organisation?._id)
        .map((h) => h.organisation!._id) ?? [];

    if (approvedOrgIds.length) {
      const staffUsers = await User.find({
        organisation: { $in: approvedOrgIds },
        role: { $in: ['carer', 'management'] },
        status: 'active',
      }).select('fullName email role');

      staffUsers.forEach((u) => {
        accessUsers.push({
          _id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          role: u.role as 'carer' | 'management',
        });
      });
    }

    return NextResponse.json(accessUsers, { status: 200 });
  } catch (err) {
    console.error('Error fetching users with access:', err);
    return NextResponse.json(
      { error: 'Failed to fetch users with access.' },
      { status: 500 }
    );
  }
}