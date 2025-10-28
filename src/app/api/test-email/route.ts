// Purpose: API route used to test sending emails

import { NextResponse } from 'next/server';
import { sendResetEmail } from '@/lib/email';

export async function GET() {
  try {
    const testRecipient = 'youremail.com'; // Replace with test email
    const testLink =
      'https://schedule-of-care-git-main-denisealexanders-projects-78748837.vercel.app/reset-password?token=test123';

    await sendResetEmail(testRecipient, testLink);

    return NextResponse.json({ message: `Email sent to ${testRecipient}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
