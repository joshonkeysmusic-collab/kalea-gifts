import { describe, expect, it } from 'vitest';
import { sanitize } from '../api/event';

describe('sanitize', () => {
  it('accepts known events and stamps server time', () => {
    const out = JSON.parse(sanitize(JSON.stringify({ type: 'start', sid: 'abc123', ts: 1, props: { via: 'challenge' } }))!);
    expect(out.type).toBe('start');
    expect(out.ts).toBeGreaterThan(1);
    expect(out.props.via).toBe('challenge');
  });
  it('rejects unknown types, bad ids, junk and oversized payloads', () => {
    expect(sanitize(JSON.stringify({ type: 'drop_table', sid: 'abc123' }))).toBeNull();
    expect(sanitize(JSON.stringify({ type: 'start', sid: '<script>' }))).toBeNull();
    expect(sanitize('not json')).toBeNull();
    expect(sanitize(JSON.stringify({ type: 'start', sid: 'abc123', props: { x: 'a'.repeat(5000) } }))).toBeNull();
  });
});
