import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailConfigured, emailFrom, sendMail } from './send';
import { resetPasswordMessage, verifyEmailMessage } from './templates';

const CONFIGURED = {
  RESEND_API_KEY: 're_test_key',
  EMAIL_FROM: 'Market Academy <hello@example.com>',
};

const MAIL = { to: 'ram@example.com', subject: 'Hello', text: 'plain', html: '<p>rich</p>' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('whether email is configured', () => {
  it('needs both the key and the from address', () => {
    expect(emailConfigured(CONFIGURED)).toBe(true);
    expect(emailConfigured({ RESEND_API_KEY: 'x' })).toBe(false);
    expect(emailConfigured({ EMAIL_FROM: 'x' })).toBe(false);
    expect(emailConfigured({})).toBe(false);
  });
});

describe('unconfigured', () => {
  it('prints the message in development instead of sending it', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await sendMail(MAIL, { NODE_ENV: 'development' });

    expect(result).toEqual({ ok: true, id: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    // The link has to be in there, because the terminal is the inbox locally.
    expect(log.mock.calls[0][0]).toContain('plain');
  });

  /**
   * The failure that matters. Quietly reporting success in production means a
   * learner waits for a reset that was never going to arrive.
   */
  it('refuses in production rather than pretending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendMail(MAIL, { NODE_ENV: 'production' });

    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('configured', () => {
  it('posts both a text and an HTML part, with the key in the header', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }));

    const result = await sendMail(MAIL, CONFIGURED);
    expect(result).toEqual({ ok: true, id: 'msg_1' });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer re_test_key');

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.from).toBe('Market Academy <hello@example.com>');
    expect(body.to).toEqual(['ram@example.com']);
    expect(body.text).toBe('plain');
    expect(body.html).toBe('<p>rich</p>');
  });

  it('reports a rejection without repeating the provider’s wording', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('domain not verified: example.com', { status: 403 }),
    );

    const result = await sendMail(MAIL, CONFIGURED);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).not.toContain('example.com');
  });

  it('survives the provider being unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));

    const result = await sendMail(MAIL, CONFIGURED);
    expect(result.ok).toBe(false);
  });

  it('falls back to the provider test sender only when none is set', () => {
    expect(emailFrom(CONFIGURED)).toBe('Market Academy <hello@example.com>');
    expect(emailFrom({})).toContain('resend.dev');
  });
});

describe('the messages themselves', () => {
  const url = 'https://market-academy.example/verify-email?token=abc';

  it('carry the link in both the text and the HTML part', () => {
    for (const message of [
      verifyEmailMessage({ url, displayName: 'Ram' }),
      resetPasswordMessage({ url, displayName: 'Ram' }),
    ]) {
      expect(message.text).toContain(url);
      expect(message.html).toContain(url);
      expect(message.subject.length).toBeGreaterThan(0);
    }
  });

  it('say what to do if it was not you', () => {
    expect(resetPasswordMessage({ url, displayName: 'Ram' }).text).toContain('not you');
    expect(verifyEmailMessage({ url, displayName: 'Ram' }).text).toContain('did not create an account');
  });

  it('escape a display name so it cannot inject markup into the HTML part', () => {
    const message = verifyEmailMessage({ url, displayName: '<img src=x onerror=alert(1)>' });
    expect(message.html).not.toContain('<img');
    expect(message.html).toContain('&lt;img');
  });

  it('load no remote images and no tracking pixel', () => {
    const message = resetPasswordMessage({ url, displayName: 'Ram' });
    expect(message.html).not.toMatch(/<img/i);
    expect(message.html).not.toMatch(/https?:\/\/(?!market-academy\.example)/);
  });
});
