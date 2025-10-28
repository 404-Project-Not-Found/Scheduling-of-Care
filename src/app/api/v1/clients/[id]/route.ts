/**
 * File path: /api/v1/clients/[id]/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 *
 * Purpose: Handles a client's profile - fetching, updating and deleting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import {
  saveBase64Image,
  deleteImage,
  isBase64Image,
} from '@/lib/image-upload';

/**
 * Fetches a single client by their MongoDB ID.
 * @param req
 * @param context
 * @returns client document as JSON
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extracts client ID from dynamic route params
    const { id } = await context.params;

    await connectDB();

    // Find client by ID and return plain JS object
    // Exclude avatarUrl to reduce payload size
    const client = await Client.findById(id).select('-avatarUrl').lean();

    // Client does not exist
    if (!client) {
      return NextResponse.json(
        { error: 'Client does not exist' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (err) {
    // Handle unexpected errors
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

/**
 * Updates an existing client by ID.
 * @param req
 * @param context
 * @returns updated client document as JSON
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Extracts client ID from dynamic route params
  const { id } = await context.params;

  await connectDB();

  // Parse new client data
  const data = await req.json();

  // Handle avatar update if it's a base64 image
  if (data.avatarUrl && isBase64Image(data.avatarUrl)) {
    // Get current client to delete old avatar if exists
    const currentClient = await Client.findById(id);
    if (
      currentClient?.avatarUrl &&
      currentClient.avatarUrl.startsWith('/uploads/')
    ) {
      deleteImage(currentClient.avatarUrl);
    }

    // Save new image and update the data
    data.avatarUrl = saveBase64Image(
      data.avatarUrl,
      `client_${data.name || id}`,
      'clients'
    );
  }

  //Update the client and return the updated document
  const updated = await Client.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return NextResponse.json(updated);
}

/**
 * Delete a client by ID.
 * @param req
 * @param context
 * @returns success response
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Find client by ID and return plain JS object
  const { id } = await context.params;

  await connectDB();

  // Get client to delete avatar if exists
  const client = await Client.findById(id);
  if (client?.avatarUrl && client.avatarUrl.startsWith('/uploads/')) {
    deleteImage(client.avatarUrl);
  }

  // Delete client document by ID
  await Client.findByIdAndDelete(id);
  //return success response
  return NextResponse.json({ success: true });
}
