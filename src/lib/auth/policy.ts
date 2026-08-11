/**
 * Password policy — the parts with no crypto in them.
 *
 * Split out from password.ts so the sign-up form can import the rule without
 * dragging node:crypto into the browser bundle. The form and the server now
 * enforce the same rule from the same source, which is the only way a client
 * check and a server check stay in agreement.
 */

/** The narrowest rule that still rules out the passwords that actually get broken. */
export const MIN_PASSWORD_LENGTH = 10;

export const MAX_PASSWORD_LENGTH = 200;

/**
 * Not a strength meter. Strength meters teach people to add a `1` and a `!` to
 * a word, which produces a password that scores well and breaks instantly.
 * Length is the thing that actually helps, so length is the thing required.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters. Length matters far more than symbols — a short password with a "!" on the end is still short.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `That is longer than ${MAX_PASSWORD_LENGTH} characters, which is almost certainly a mistake.`;
  }
  if (/^(.)\1+$/.test(password)) {
    return 'That is the same character repeated. Try a phrase you will remember instead.';
  }
  return null;
}
