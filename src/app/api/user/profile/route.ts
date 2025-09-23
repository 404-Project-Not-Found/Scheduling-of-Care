import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface IUser {
  _id: string;
  email: string;
  role: string;
  fullName: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean<IUser>();

  if (!user) {
    return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });
}
