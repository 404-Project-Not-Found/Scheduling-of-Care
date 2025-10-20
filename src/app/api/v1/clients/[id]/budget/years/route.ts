/**
 * Filename: /app/api/v1/clients/[id]/budget/years/route.ts
 * Author: Zahra Rizqita
 * Date Created: 19/10/2025
 *
 * Return years where budget and transaction exist for this client
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BudgetYear } from "@/models/Budget";
import { Types } from 'mongoose';
import { Transaction } from "@/models/Transaction";

export async function GET(
  _req: Request,
  {params}: {params: {clientId: string}}
){
  await connectDB();

  let clientId: Types.ObjectId;
  try{
    clientId = new Types.ObjectId(params.clientId);
  } catch{
    return NextResponse.json({error: 'Invalid ClientId'}, {status: 422});
  }

  const docs = await BudgetYear
    .find({ clientId })
    .select({ year: 1, _id: 0 })
    .sort({ year: -1 })
    .lean();

  const years = Array.from(new Set(docs.map((d) => Number(d.year))))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a);

  return NextResponse.json(years);
}

