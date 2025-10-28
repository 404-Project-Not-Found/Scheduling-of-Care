/**
 * File path: /lib/emails.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 *
 * Purpose: used to send emails (e.g. password reset link).
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
console.log('RESEND key loaded?', !!process.env.RESEND_API_KEY);

export async function sendResetEmail(to: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // for testing
      to,
      subject: 'Reset your password',
      html: `
        <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    console.log('Password reset email sent to', to);
  } catch (error) {
    console.error('Failed to send reset email:', error);
    throw new Error('Email sending failed.');
  }
}
