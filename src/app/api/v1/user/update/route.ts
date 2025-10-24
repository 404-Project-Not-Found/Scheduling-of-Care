/**
 * File path: /api/v1/user/update/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 *
 * Purpose: Updates users details when they change their details.
 *
 * Last Updated by Denise Alexander (24/10/2025): users can now update
 * their name, email, phone number and password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Retrieve the current session (user must be authenticated)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { email, password, fullName, phone, profilePic } = await req.json();

    await connectDB();

    // Object to update user details
    const updateData: {
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
      profilePic?: string;
    } = {};

    if (email) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      // The email is already in use by user from another account
      if (userExists && userExists._id.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'This email is already in use by another account.' },
          { status: 400 }
        );
      }
      updateData.email = email.toLowerCase();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (fullName) updateData.fullName = fullName;

    if (phone) updateData.phone = phone;

    if (profilePic) updateData.profilePic = profilePic;

    // Update the user in the DB using their session ID
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id, // Ensures they can only update their own account
      updateData,
      { new: true }
    );

    // User does not exist
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Successfully updated
    return NextResponse.json({
      message: 'User details updated successfully',
      user: {
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profilePic: updatedUser.profilePic,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
