/**
 * Filename: /signup/route.ts
 * Author: Denise Alexander
 * Date Created: 16/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import Organisation from '@/models/Organisation';
import User from '@/models/User';

interface InviteCode {
  code: string;
  role: 'management' | 'carer';
  expiresAt?: Date;
  used: boolean;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Extract data from request body
    const { fullName, email, password, confirm, role, orgName, inviteCode } =
      await req.json();

    // Validate required fields
    if (!fullName || !email || !password || !confirm || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Ensure passwords match
    if (password !== confirm) {
      return NextResponse.json(
        { error: 'The passwords entered do not match. Please try again.' },
        { status: 400 }
      );
    }

    // Check if a user already exists under the email
    const emailLower = email.toLowerCase();
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      ); // Conflict status
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user info into the database
    const newUser = await User.create({
      fullName,
      email: emailLower,
      password: hashedPassword,
      role: role.toLowerCase(),
      createdAt: new Date(),
    });

    let orgId = null;

    if (role === 'management' && orgName) {
      const existingOrg = await Organisation.findOne({ name: orgName });
      if (existingOrg) {
        return NextResponse.json(
          { error: 'An organisation with this name already exists.' },
          { status: 409 }
        );
      }

      const newOrg = await Organisation.create({
        name: orgName,
        createdBy: newUser._id,
        members: [newUser._id],
        inviteCodes: [],
      });
      orgId = newOrg._id;
      newUser.organisation = orgId;
      await newUser.save();
    }

    if (role === 'carer' && inviteCode) {
      const org = await Organisation.findOne({
        'inviteCodes.code': inviteCode,
        'inviteCodes.role': 'carer',
        'inviteCodes.used': false,
      });
      if (!org) {
        return NextResponse.json(
          { error: 'Invalid or used invite code.' },
          { status: 400 }
        );
      }

      org.inviteCodes = org.inviteCodes.map(
        (c: InviteCode & mongoose.Document) =>
          c.code === inviteCode ? { ...c.toObject(), used: true } : c
      );

      org.members.push(newUser._id);
      await org.save();

      orgId = org._id;
      newUser.organisation = orgId;
      await newUser.save();
    }

    // Success response with new user ID
    return NextResponse.json({
      message: 'New user created successfully!',
      userId: newUser._id,
      organisation: orgId,
    });
  } catch (error) {
    console.error(error);
    // Generic server error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
