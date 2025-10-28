/**
 * File path: /api/v1/clients/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 *
 * Purpose: Handles client lists belonging to the logged-in user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saveBase64Image, isBase64Image } from '@/lib/image-upload';

/**
 * Retrieves all clients that belong to the currently authenticated user.
 * @returns client list
 */
export async function GET() {
  // Ensures user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  // Fetch only the clients created by the logged in user
  // Exclude avatarUrl to reduce payload size (use separate endpoint to get avatar)
  const clients = await Client.find({ createdBy: session.user.id })
    .select('-avatarUrl')
    .lean();
  // return client list
  return NextResponse.json(clients);
}

/**
 * Creates a new client record and associates it with the logged in user
 * @param req
 * @returns created client
 */
export async function POST(req: NextRequest) {
  // Ensures the user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const data = await req.json();
  try {
    await connectDB();

    // Handle avatar upload if it's a base64 image
    let avatarUrl = data.avatarUrl || '';
    if (avatarUrl && isBase64Image(avatarUrl)) {
      avatarUrl = saveBase64Image(
        avatarUrl,
        `client_${data.name || 'unknown'}`,
        'clients'
      );
    }

    // Create client, attaching `createdBy` to track ownership
    const newClient = await Client.create({
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      accessCode: data.accessCode,
      createdBy: session.user.id,
      avatarUrl,
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      emergencyContact: data.emergencyContact || '',
      primaryCaregiver: data.primaryCaregiver || '',
      address: data.address || '',
      medicalNotes: {
        diagnosedDisabilities: data.medicalNotes?.diagnosedDisabilities || '',
        currentMedication: data.medicalNotes?.currentMedication || '',
        allergies: data.medicalNotes?.allergies || '',
        recentMedicalHistory: data.medicalNotes?.recentMedicalHistory || '',
        primaryHealthContact: data.medicalNotes?.primaryHealthContact || '',
      },
    });
    // return created client
    return NextResponse.json(newClient, { status: 201 });
  } catch (err) {
    // DB errors
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
