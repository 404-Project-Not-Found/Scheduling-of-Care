/**
 * File path: /api/v1/family_requests/route.ts
 * Author: Denise Alexander
 * Date Created: 14/10/2025
 *
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import FamilyRequest from '@/models/FamilyRequest';

/**
 * Handles POST requests to create a new family request.
 */
export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { clientId, taskCategory, taskSubCategory, details, reason } = body;

    // Validate required fields
    if (!clientId || !taskCategory || !taskSubCategory || !details || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields!' },
        { status: 400 }
      );
    }

    // Create a new family request document in MongoDB
    const newFamilyRequest = await FamilyRequest.create({
      clientId,
      taskCategory,
      taskSubCategory,
      details,
      reason,
    });

    return NextResponse.json(newFamilyRequest, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to retrieve family requests for a specific client.
 * @param req
 * @returns family requests for the specified clientId
 */
export async function GET(req: NextRequest) {
  await connectDB();

  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId parameter!' },
      { status: 400 }
    );
  }

  try {
    // Find all family requests for the specified clientId, sorted by creation date (newest first)
    const familyRequests = await FamilyRequest.find({ clientId }).sort({
      createdAt: -1,
    });
    return NextResponse.json(familyRequests, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
