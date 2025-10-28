/**
 * File path: /api/v1/request_reset/route.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 *
 * Purpose: Handles requests to reset user password.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { sendResetEmail } from '@/lib/email';

/**
 * Handles password reset link and email
 * @param req
 * @returns default response message
 */
export async function POST(req: Request) {
  await connectDB();

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        message: 'If the account exists, a reset link has been sent.',
      });
    }

    // Remove any previous tokens for this user
    await PasswordResetToken.deleteMany({ userID: user._id });

    // Generate a new token every time
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save the new token to DB
    await PasswordResetToken.create({
      userID: user._id,
      token,
      expiresAt: expiry,
    });

    // Build a new reset link each time
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URI}/reset_password?token=${token}`;

    // Send the new email
    await sendResetEmail(user.email, resetLink);

    return NextResponse.json({
      message: 'If the account exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
