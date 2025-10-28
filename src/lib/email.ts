/**
 * File path: /lib/email.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 *
 * Purpose: used to send emails (e.g. password reset link).
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sends email with link to reset password
export async function sendResetEmail(to: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // for testing
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px;">
          <p style="line-height: 1.5;">
            Click 
            <a href="${resetLink}" style="font-weight: bold; text-decoration: underline;">here</a> 
            to reset your password. This link will expire in 15 minutes.
          </p>
        </div>
      `,
    });

    console.log('Password reset email sent to', to);
  } catch (error) {
    console.error('Failed to send reset email:', error);
    throw new Error('Email sending failed.');
  }
}
