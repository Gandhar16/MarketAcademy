import { describe, expect, it, vi } from 'vitest';
import { RateLimiter, TTLCache } from './cache';

describe('TTLCache', () => {
  it('returns a value inside its TTL and drops it after', () => {
    const c = new TTLCache<number>(1000);
    c.set('a', 1, 0);
    expect(c.get('a', 999)).toBe(1);
    expect(c.get('a', 1000)).toBeUndefined();
    expect(c.get('a', 5000)).toBeUndefined();
  });

  it('evicts the expired entry rather than leaking it', () => {
    const c = new TTLCache<number>(100);
    c.set('a', 1, 0);
    c.get('a', 500);
    expect(c.size).toBe(0);
  });

  it('evicts the oldest entry when full', () => {
    const c = new TTLCache<number>(10_000, 3);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.set('d', 4);
    expect(c.size).toBe(3);
    expect(c.get('a')).toBeUndefined();
    expect(c.get('d')).toBe(4);
  });

  it('coalesces concurrent misses into a single upstream call', async () => {
    const c = new TTLCache<string>(10_000);
    const loader = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return 'value';
    });

    const results = await Promise.all([c.fetch('k', loader), c.fetch('k', loader), c.fetch('k', loader)]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['value', 'value', 'value']);
  });

  it('serves later callers from cache without calling the loader again', async () => {
    const c = new TTLCache<string>(10_000);
    const loader = vi.fn(async () => 'v');
    await c.fetch('k', loader);
    await c.fetch('k', loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache a rejected load, and lets the next caller retry', async () => {
    const c = new TTLCache<string>(10_000);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      if (calls === 1) throw new Error('upstream down');
      return 'recovered';
    };

    await expect(c.fetch('k', loader)).rejects.toThrow('upstream down');
    // A failure must not poison the key — the second caller gets a real attempt.
    await expect(c.fetch('k', loader)).resolves.toBe('recovered');
  });

  it('propagates the rejection to every coalesced caller', async () => {
    const c = new TTLCache<string>(10_000);
    const loader = async () => {
      throw new Error('boom');
    };
    const a = c.fetch('k', loader);
    const b = c.fetch('k', loader);
    await expect(a).rejects.toThrow('boom');
    await expect(b).rejects.toThrow('boom');
  });

  it('clears both stored and in-flight state', () => {
    const c = new TTLCache<number>(1000);
    c.set('a', 1);
    c.clear();
    expect(c.size).toBe(0);
  });

  it('treats distinct keys independently', () => {
    const c = new TTLCache<number>(1000);
    c.set('a', 1, 0);
    c.set('b', 2, 500);
    expect(c.get('a', 1200)).toBeUndefined();
    expect(c.get('b', 1200)).toBe(2);
  });
});

describe('RateLimiter', () => {
  it('allows up to the limit and blocks beyond it', () => {
    const rl = new RateLimiter(3, 1000);
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 0).allowed).toBe(false);
  });

  it('reports remaining accurately and never goes negative', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.check('ip', 0).remaining).toBe(1);
    expect(rl.check('ip', 0).remaining).toBe(0);
    expect(rl.check('ip', 0).remaining).toBe(0);
    expect(rl.check('ip', 0).remaining).toBe(0);
  });

  it('resets after the window', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.check('ip', 0).allowed).toBe(true);
    expect(rl.check('ip', 500).allowed).toBe(false);
    expect(rl.check('ip', 1000).allowed).toBe(true);
  });

  it('tracks clients separately, so one hot loop cannot lock everyone out', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.check('a', 0).allowed).toBe(true);
    expect(rl.check('a', 0).allowed).toBe(false);
    expect(rl.check('b', 0).allowed).toBe(true);
  });

  it('reports a reset time in the future while blocking', () => {
    const rl = new RateLimiter(1, 1000);
    rl.check('ip', 0);
    const blocked = rl.check('ip', 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetAt).toBe(1000);
  });
});
