
import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { sseSubscribe } from '@/lib/sse-bus';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const yearStr = url.searchParams.get('year') || '';
  const {id: clientIdStr } = await ctx.params;

  if (!clientIdStr || !Types.ObjectId.isValid(clientIdStr)) {
    return new Response('Invalid client id', { status: 400 });
  }
  const year = Number(yearStr);
  if (!Number.isInteger(year)) {
    return new Response('Invalid year', { status: 400 });
  }

  const key = `${clientIdStr}:${year}`;
  const encoder = new TextEncoder();

  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try { heartbeat && clearInterval(heartbeat); } catch {}
    heartbeat = null;
    try { unsubscribe && unsubscribe(); } catch {}
    unsubscribe = null;
    writer.close().catch(() => {});
  };

  const write = async (event: string, data?: any) => {
    if (closed) return;
    const chunk =
      `event: ${event}\n` +
      `data: ${data === undefined ? '' : JSON.stringify(data)}\n\n`;
    try {
      await writer.write(encoder.encode(chunk));
    } catch {
      cleanup();
    }
  };


  unsubscribe = sseSubscribe(key, (event, data) => {
    void write(event, data);
  });

  void write('ping', { ts: Date.now() });
  heartbeat = setInterval(() => { void write('ping', { ts: Date.now() }); }, 25_000);

  try {
    req.signal.addEventListener('abort', cleanup);
  } catch {}

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}