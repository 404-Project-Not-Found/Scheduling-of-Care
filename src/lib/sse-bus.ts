
type Key = string; // `${clientId}:${year}`
type Sender = (event: string, data?: any) => void;

const channels = new Map<Key, Set<Sender>>();

export function sseSubscribe(key: Key, send: Sender) {
  let set = channels.get(key);
  if (!set) {
    set = new Set();
    channels.set(key, set);
  }
  set.add(send);
  return () => sseUnsubscribe(key, send);
}

export function sseUnsubscribe(key: Key, send: Sender) {
  const set = channels.get(key);
  if (!set) return;
  set.delete(send);
  if (set.size === 0) channels.delete(key);
}

export function ssePublish(key: Key, event: string, data?: any) {
  const set = channels.get(key);
  if (!set) return;
  for (const send of set) {
    try {
      send(event, data);
    } catch {
    }
  }
}

export function publishBudgetChange(clientId: string, year: number) {
  ssePublish(`${clientId}:${year}`, 'change', { ts: Date.now() });
}
