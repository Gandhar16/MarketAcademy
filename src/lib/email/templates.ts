/**
 * The only two messages this site sends.
 *
 * Both are transactional and both were asked for. There is no newsletter here
 * and no unsubscribe link, because there is nothing to unsubscribe from — an
 * unsubscribe footer on a password reset is cargo-culted from marketing mail
 * and only makes people wonder what else they were signed up for.
 *
 * ── How these are written ───────────────────────────────────────────────────
 *
 * Plain HTML with inline styles, tables avoided, no images, no web fonts, no
 * tracking pixel. Mail clients are not browsers: Gmail strips <style> blocks,
 * Outlook renders with Word, and a remote image is a privacy problem the moment
 * it loads. Every message is legible as text alone — the HTML is the nicety.
 *
 * The tone matches the site: say what happened, say what to do, and say what to
 * do if it was not you.
 */

export interface Message {
  subject: string;
  text: string;
  html: string;
}

const BRAND = 'Market Academy';

/** Shared shell. Inline styles only, and a max-width that survives a phone. */
function wrap(body: string, footer: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
    <div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;">${BRAND}</div>
    ${body}
  </div>
  <div style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.6;color:#6b7280;">${footer}</div>
</body></html>`;
}

function button(href: string, label: string): string {
  // A real link, styled. Some clients drop background colours, and when this
  // degrades it degrades to an underlined link that still works.
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;">${label}</a></p>`;
}

export function verifyEmailMessage({ url, displayName }: { url: string; displayName: string }): Message {
  const subject = `Confirm your email address`;

  const text = [
    `Hello ${displayName},`,
    '',
    `Confirm this address so you can recover your ${BRAND} account if you ever forget your password:`,
    '',
    url,
    '',
    'The link works once, and expires in an hour.',
    '',
    "If you did not create an account, ignore this — nothing was set up, and we won't email you again.",
  ].join('\n');

  const html = wrap(
    `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;">Hello ${escape(displayName)},</p>
     <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Confirm this address so you can recover your account if you ever forget your password.</p>
     ${button(url, 'Confirm this address')}
     <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">The link works once, and expires in an hour. If the button does nothing, paste this into your browser:</p>
     <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;color:#6b7280;">${escape(url)}</p>`,
    "If you did not create an account, ignore this — nothing was set up, and we won't email you again.",
  );

  return { subject, text, html };
}

export function resetPasswordMessage({ url, displayName }: { url: string; displayName: string }): Message {
  const subject = `Reset your ${BRAND} password`;

  const text = [
    `Hello ${displayName},`,
    '',
    'Someone asked to reset the password on this account. If that was you, use this link:',
    '',
    url,
    '',
    'The link works once, and expires in an hour.',
    '',
    'If it was not you, you do not need to do anything. Your password has not changed, and this link',
    'will expire on its own. Nobody can use it without opening this mailbox.',
  ].join('\n');

  const html = wrap(
    `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;">Hello ${escape(displayName)},</p>
     <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Someone asked to reset the password on this account. If that was you:</p>
     ${button(url, 'Choose a new password')}
     <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">The link works once, and expires in an hour. If the button does nothing, paste this into your browser:</p>
     <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;color:#6b7280;">${escape(url)}</p>`,
    'If it was not you, you do not need to do anything. Your password has not changed, and the link expires on its own.',
  );

  return { subject, text, html };
}

/**
 * A display name is chosen by the person it belongs to, and goes into HTML that
 * no framework is escaping for us here — this is a string, not JSX.
 */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
