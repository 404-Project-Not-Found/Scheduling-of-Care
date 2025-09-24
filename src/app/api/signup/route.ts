import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// Defines valid user roles
const ROLES = ['carer', 'management', 'family'] as const;

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function POST(req: NextRequest) {
  try {
    // Extract data from request body
    const { fullName, email, password, confirm, role } = await req.json();

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

    // Validate role against allowed roles
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    /* Connect to MongoDB
        const client = await clientPromise;
        const db = client.db("schedule-of-care");
        const usersCollection = db.collection("users"); */

    await connectDB();

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

    // Success response with new user ID
    return NextResponse.json({
      message: 'New user created',
      userId: newUser._id,
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
