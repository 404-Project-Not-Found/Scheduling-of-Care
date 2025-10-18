/**
 * api/v1/occurence/route.ts
 * Author: Zahra Rizqita
 * Created on: 18/10/2025
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Occurence from '@/models/Occurence';
import CareItem from '@/models/CareItem';


export async function GET(req: Request) {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');   // YYYY-MM-DD
    const end   = searchParams.get('end');     // YYYY-MM-DD
    const taskIdsCsv = searchParams.get('careItem');
}