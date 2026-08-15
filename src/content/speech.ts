/**
 * Captions, rewritten for a voice rather than an eye.
 *
 * WHAT THIS IS NOT
 *
 * It is not a second copy of the script. The caption stays the written truth;
 * this only changes how the same sentence is *pronounced*. Nothing here may add
 * a claim, drop a figure, or soften a number — the test file asserts that every
 * digit in the caption survives into the spoken form, because the whole reason
 * a synthetic narrator is acceptable here is that it cannot say something the
 * text does not.
 *
 * WHY IT IS NEEDED AT ALL
 *
 * A neural TTS reads characters, and financial writing is full of characters
 * that are read silently by people and wrongly by machines. Left alone, the
 * cost explainer says "roopee one comma zero zero comma zero zero zero" and
 * pronounces STT as a word. Both are the sort of thing that makes a listener
 * stop trusting the voice about thirty seconds in, at which point the whole
 * exercise has cost more than it bought.
 */

/**
 * Initialisms that must be spelled out letter by letter.
 *
 * The absentee is deliberate: SEBI is said as a word by everyone who says it,
 * so spelling it would be the wrong kind of correct. Same principle as the
 * glossary — match how people actually talk, not how the letters look.
 */
const SPELLED_OUT = ['STT', 'GST', 'NSE', 'BSE', 'CDSL', 'NSDL', 'DP', 'IV', 'LTP', 'OI', 'SIP', 'IPO'];

/** Said as words, listed so the rule above provably left them alone. */
export const SAID_AS_WORDS = ['SEBI', 'NIFTY', 'NAV'];

const LAKH = 100_000;
const CRORE = 10_000_000;

/**
 * A rupee figure, spoken the way a person in India would say it.
 *
 * `₹1,00,000` is "one lakh rupees", not "one comma zero zero comma zero zero
 * zero". Lakh and crore rather than million: the audience for a lesson about
 * STT counts in lakhs, and a narrator who counts in millions is a narrator
 * talking about somebody else's market.
 */
function speakRupees(raw: string): string {
  const value = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(value)) return raw;

  // Big round-ish sums read better in Indian units. Small and precise ones —
  // a ₹6.14 exchange charge — must stay exact, because the point of that scene
  // is that the small lines are real.
  if (value >= CRORE && value % (CRORE / 100) === 0) {
    return `${trimZeros(value / CRORE)} crore rupees`;
  }
  if (value >= LAKH && value % (LAKH / 100) === 0) {
    return `${trimZeros(value / LAKH)} lakh rupees`;
  }

  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  if (rupees === 0 && paise > 0) return `${paise} paise`;
  if (paise === 0) return `${rupees} rupees`;
  return `${rupees} rupees ${paise} paise`;
}

function trimZeros(n: number): string {
  return String(Number(n.toFixed(2)));
}

/**
 * Turn one caption into something worth listening to.
 *
 * Order matters. Currency runs before the comma cleanup, because the comma
 * grouping is what identifies an Indian-formatted amount in the first place.
 */
export function speakable(caption: string): string {
  let out = caption;

  // ₹1,00,000 / ₹238.32 / ₹0.20
  out = out.replace(/₹\s?([\d,]+(?:\.\d+)?)/g, (_m, num: string) => speakRupees(num));

  // 0.24% → 0.24 percent. Spoken, "percent" is never abbreviated.
  out = out.replace(/(\d)\s?%/g, '$1 percent');

  // T+1 settlement is said "T plus one", never "T one".
  out = out.replace(/\bT\+(\d)\b/g, 'T plus $1');

  // Spelled-out initialisms. Word-boundary anchored so a longer token that
  // merely contains one — and any lower-case word — is left alone.
  for (const term of SPELLED_OUT) {
    out = out.replace(new RegExp(`\\b${term}\\b`, 'g'), term.split('').join(' '));
  }

  // A hyphenated proper name is read as a break rather than a name.
  out = out.replace(/\bBlack-Scholes\b/g, 'Black Scholes');

  // Em dashes are a written device. Spoken, they are a beat — and a comma is
  // the only punctuation a TTS reliably turns into one.
  out = out.replace(/\s*—\s*/g, ', ');

  // Quotation marks around a phrase read as nothing at best and as a stumble
  // at worst. The scare quotes in "zero brokerage" are carried by the sentence.
  out = out.replace(/["“”]/g, '');

  // Collapse anything the substitutions doubled up.
  return out.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
}
