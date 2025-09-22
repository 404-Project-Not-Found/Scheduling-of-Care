import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { email, password } = await req.json();

    await connectDB();

    const updateData: { email?: string; password?: string } = {};

    if (email) {
      updateData.email = email.toLowerCase();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update by email - not secure, just for demo until auth is added
    const updateUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    );

    if (!updateUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User details updated successfully',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
