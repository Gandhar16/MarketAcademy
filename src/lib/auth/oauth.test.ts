import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  PROVIDERS,
  authorizeUrlFor,
  challengeFor,
  createState,
  createVerifier,
  enabledProviders,
  providerById,
  redirectUri,
  siteUrl,
} from './oauth';

const ENV = {
  OAUTH_GOOGLE_CLIENT_ID: 'google-client',
  OAUTH_GOOGLE_CLIENT_SECRET: 'google-secret',
  SITE_URL: 'https://market-academy.example',
};

describe('which providers are offered', () => {
  it('offers only the ones with both credentials set', () => {
    expect(enabledProviders(ENV).map((p) => p.id)).toEqual(['google']);
  });

  it('offers none at all when nothing is configured', () => {
    expect(enabledProviders({})).toEqual([]);
  });

  it('does not offer a provider with an id but no secret', () => {
    const half = { OAUTH_GITHUB_CLIENT_ID: 'x' };
    expect(enabledProviders(half)).toEqual([]);
  });

  it('knows every provider by id, and nothing else', () => {
    for (const p of PROVIDERS) expect(providerById(p.id)?.id).toBe(p.id);
    expect(providerById('myspace')).toBeNull();
    expect(providerById('')).toBeNull();
  });
});

describe('PKCE', () => {
  it('derives an S256 challenge from the verifier', () => {
    const verifier = createVerifier();
    const expected = createHash('sha256').update(verifier).digest('base64url');
    expect(challengeFor(verifier)).toBe(expected);
  });

  it('produces a fresh verifier and state every time', () => {
    expect(createVerifier()).not.toBe(createVerifier());
    expect(createState()).not.toBe(createState());
  });

  it('is URL-safe, so it survives a query string unescaped', () => {
    expect(createVerifier()).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challengeFor('abc')).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('where the provider sends the browser back', () => {
  it('is built from configuration, never from a request header', () => {
    expect(redirectUri('google', ENV)).toBe('https://market-academy.example/api/auth/oauth/google/callback');
  });

  it('tolerates a trailing slash on SITE_URL', () => {
    const env = { SITE_URL: 'https://x.example/' };
    expect(siteUrl(env)).toBe('https://x.example');
  });

  it('falls back to the Vercel production domain, then to localhost', () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://x.vercel.app');
    expect(siteUrl({})).toBe('http://localhost:3000');
  });
});

describe('the authorize URL', () => {
  const google = providerById('google')!;
  const url = new URL(authorizeUrlFor(google, { state: 'the-state', verifier: 'the-verifier', env: ENV }));

  it('carries the client, the redirect, the scope and the state', () => {
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('google-client');
    expect(url.searchParams.get('redirect_uri')).toBe('https://market-academy.example/api/auth/oauth/google/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('state')).toBe('the-state');
  });

  it('asks for S256 PKCE, and sends the challenge rather than the verifier', () => {
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(challengeFor('the-verifier'));
    expect(url.toString()).not.toContain('the-verifier');
  });

  it('never puts the client secret in a URL the browser will follow', () => {
    expect(url.toString()).not.toContain('google-secret');
  });

  it('asks Google to let a shared device choose an account', () => {
    expect(url.searchParams.get('prompt')).toBe('select_account');
  });
});
