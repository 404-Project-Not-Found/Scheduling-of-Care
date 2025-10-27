import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Occurrence from '@/models/Occurrence';


const isYYYYMMDD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toUTCStart = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00.000Z`);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await ctx.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
    }
    const clientId = new Types.ObjectId(id);

    const u = new URL(req.url);
    const startStr = (u.searchParams.get('start') || '').slice(0, 10);
    const endStr = (u.searchParams.get('end') || '').slice(0, 10);
    const slugsParam = u.searchParams.get('slugs') || '';

    if (!isYYYYMMDD(startStr) || !isYYYYMMDD(endStr)) {
      return NextResponse.json(
        { error: 'start and end must be YYYY-MM-DD' },
        { status: 400 }
      );
    }
    if (startStr > endStr) {
      return NextResponse.json(
        { error: 'start must be <= end' },
        { status: 400 }
      );
    }


    const MAX_DAYS = 93;
    const start = toUTCStart(startStr);
    const endNext = toUTCStart(endStr);
    endNext.setUTCDate(endNext.getUTCDate() + 1);
    const daySpan =
      Math.round((+endNext - +start) / (24 * 60 * 60 * 1000)) || 0;
    if (daySpan > MAX_DAYS + 1) {
      return NextResponse.json(
        { error: `Date window too large (> ${MAX_DAYS} days)` },
        { status: 400 }
      );
    }

    const slugs = Array.from(
      new Set(
        slugsParam
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    const projection = {
      _id: 0,
      careItemSlug: 1,
      date: 1,
      status: 1,
    } as const;

    const filter: any = {
      clientId,
      date: { $gte: start, $lt: endNext },
    };
    if (slugs.length) filter.careItemSlug = { $in: slugs };

    const rows = await Occurrence.find(filter, projection)
      .sort({ date: 1, careItemSlug: 1 })
      .hint({ clientId: 1, date: 1, careItemSlug: 1 })
      .lean();

    const body = rows.map((r) => ({
      careItemSlug: r.careItemSlug,
      date:
        r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      status: r.status,
    }));

    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('occurrence window GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

