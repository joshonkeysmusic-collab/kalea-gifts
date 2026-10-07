/** URL-safe base64 JSON so a whole gift travels inside the link (no backend needed). */
export function encode(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decode<T>(s: string): T | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

/** What the recipient link carries. Short keys keep the URL compact. */
export interface GiftLink {
  v: 1;
  n?: string; // recipient name
  f?: string; // from (giver first name)
  t: string; // box title
  i: string[]; // item ids
  m?: string; // personal message
  o: string; // occasion
  s: string; // giver session id
}

export function appUrl(hash = ''): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${hash}`;
}

export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareOrCopy(data: { title: string; text: string; url: string }): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(`${data.text} ${data.url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
