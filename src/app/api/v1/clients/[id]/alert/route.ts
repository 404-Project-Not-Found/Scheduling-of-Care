/**
 * Filename: /app/api/v1/clients/[id]/alert/route.ts
 * Author: Zahra Rizqita
 * Date Created: 17/10/2025
 *
 * Send automatic alert to management when budget is nearly used up
 * 
 * TODO figure out how to send this
 */

import { NextResponse } from "next/server"; 
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {sendEmail} from "./mail"

type AlertBody = {
  year: number;
  scope: 'category' | 'careItem';
  categoryName: string;
  careItemLabel?: string;
  remaining: number;
  planned: number;
}

export async function POST(
  req: Request,
  {params}: {params: {clientId: string}}
){
  await connectDB();
  
  let clientId: Types.ObjectId;
  try{
    // eslint-disable-next-line no-new
    clientId = new Types.ObjectId(params.clientId);
  } catch{
    return NextResponse.json({error: 'Invalid ClientId'}, {status: 422});
  }

  const body: AlertBody = await req.json();
  if(
    !Number.isFinite(body.year) ||
    (body.scope !== 'category' && body.scope !== 'careItem') ||
    typeof body.categoryName !== 'string' ||
    !Number.isFinite(body.remaining) ||
    !Number.isFinite(body.planned)
  ) return NextResponse.json({error: 'Invalid payload - email management budget'}, {status: 422});

  const subject = `[Budget Alert] ${body.scope === 'category' ? 'Category' : 'Care item'} nearly used up: ${body.careItemLabel ?? body.categoryName}`;

  const msg = 
    `Budget limit matter – discussion required.\n\n` +
    `Client: ${params.clientId}\n` +
    `Year: ${body.year}\n` +
    `Category: ${body.categoryName}\n` +
    (body.careItemLabel ? `Care Item: ${body.careItemLabel}\n` : '') +
    `Remaining: $${body.remaining.toFixed(2)}\n` +
    `Planned Spend: $${body.planned.toFixed(2)}\n\n` +
    `The planned spend exceeds the remaining budget. Please review and discuss with family on how best to deal with this situation.`;

    // TODO figure out how to send this

    await SendmailTransport({})
    return NextResponse.json({ ok: true, subject, msg });
}