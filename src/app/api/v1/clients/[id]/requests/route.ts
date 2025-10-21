/**
 * File path: /api/v1/clients/[id]/requests/route.ts
 * Author: Denise Alexander
 * Date Created: 16/10/2025
 *
 * Purpose: Handles family requests for a client - get request list, add new request
 * and update request status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Request from '@/models/FamilyRequest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// --------------- Type Definitions ---------------
interface RequestDoc {
  _id: string;
  clientId: string;
  task: string;
  change: string;
  requestedBy: string;
  dateRequested: Date;
  status: 'Pending' | 'Implemented';
  resolutionDate?: Date | null;
}

interface CreateRequestBody {
  taskCategory: string;
  taskSubCategory: string;
  details: string;
  reason: string;
}

interface UpdateRequestBody {
  requestId: string;
  status: 'Pending' | 'Implemented';
}

/**
 * Fetch client specific requests
 * @param req
 * @param context
 * @returns requests
 */
export async function GET(
  req: NextRequest,
  context: { params?: { id?: string } }
) {
  await connectDB();

  const params = await Promise.resolve(context.params);
  const clientId = params?.id;

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const data = await Request.find({ clientId }).lean<RequestDoc[]>();

    // Format dates and response for front-end
    const formatted = data.map((r) => ({
      id: r._id.toString(),
      clientId: r.clientId,
      task: r.task || '',
      change: r.change || '',
      requestedBy: r.requestedBy || '',
      dateRequested: r.dateRequested
        ? new Date(r.dateRequested).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-',
      status: r.status || 'Pending',
      resolutionDate: r.resolutionDate
        ? new Date(r.resolutionDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-',
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error('Error fetching requests:', err);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

/**
 * Create a new request
 * @param req
 * @param context
 * @returns new request
 */
export async function POST(
  req: NextRequest,
  context: { params?: { id?: string } }
) {
  await connectDB();

  const params = await Promise.resolve(context.params);
  const clientId = params?.id;

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body: CreateRequestBody = await req.json();
    const { taskCategory, taskSubCategory, details, reason } = body;

    if (!taskCategory || !taskSubCategory || !details || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create new request in DB
    const newRequest = await Request.create({
      clientId,
      task: taskSubCategory,
      change: details,
      requestedBy: session.user.name || session.user.email || 'Unknown',
      dateRequested: new Date(),
      status: 'Pending',
    });

    // Newly created request
    return NextResponse.json(
      {
        id: newRequest._id.toString(),
        clientId: newRequest.clientId,
        task: newRequest.task,
        change: newRequest.change,
        requestedBy: newRequest.requestedBy,
        dateRequested: newRequest.dateRequested.toISOString(),
        status: newRequest.status,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating request:', err);
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}

/**
 * Update request status
 * @param req
 * @param context
 * @returns updated request
 */
export async function PATCH(
  req: NextRequest,
  context: { params?: { id?: string } }
) {
  await connectDB();

  const params = await Promise.resolve(context.params);
  const clientId = params?.id;

  try {
    const body: UpdateRequestBody = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing requestId or status' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'management') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Update request in DB
    const updated = await Request.findOneAndUpdate(
      { _id: requestId, clientId },
      { status, resolutionDate: status === 'Implemented' ? new Date() : null },
      { new: true }
    ).lean<RequestDoc | null>();

    if (!updated) {
      return NextResponse.json(
        { error: 'Request not found!' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: updated._id.toString(),
        clientId: updated.clientId,
        task: updated.task,
        change: updated.change,
        requestedBy: updated.requestedBy,
        dateRequested: new Date(updated.dateRequested).toLocaleDateString(
          'en-GB',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        ),
        status: updated.status,
        resolutionDate: updated.resolutionDate
          ? new Date(updated.resolutionDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating request:', err);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
