/**
 * Readability measurement.
 *
 * WHY THIS EXISTS
 *
 * The glossary work (docs/plain-language.md) fixed vocabulary: an unfamiliar
 * word now carries a definition. It did nothing about SENTENCES. A lesson can
 * use only defined words and still be a wall of 45-word subordinate clauses,
 * and that is the failure mode this module measures.
 *
 * WHAT THE RESEARCH SAYS
 *
 * Plain-language guidance across the field converges on an average sentence
 * length of 15–20 words, with individual sentences capped around 25–35. Flesch
 * found comprehension starting to degrade around 20 words per sentence. The
 * SEC's plain-English rules for prospectuses are the finance-specific version
 * of the same finding.
 *
 * Three formulas are implemented, all standard and all published:
 *
 *   Flesch Reading Ease   206.835 − 1.015·(words/sentences) − 84.6·(syllables/words)
 *   Flesch–Kincaid Grade  0.39·(words/sentences) + 11.8·(syllables/words) − 15.59
 *   Gunning Fog           0.4·[(words/sentences) + 100·(complex words/words)]
 *
 * WHAT THESE FORMULAS ARE NOT
 *
 * They measure sentence length and word length. That is all. They cannot see
 * whether the argument is ordered sensibly, whether an analogy lands, or
 * whether the reader has the background — and reviews of the literature are
 * consistent that logical organisation matters more for comprehension than any
 * score. A text can be gamed to a good score by chopping sentences at random
 * and be worse to read afterwards.
 *
 * So these numbers are used here as a SMOKE ALARM, not a grade. A lesson that
 * scores badly is very likely hard to read. A lesson that scores well has
 * merely failed to prove it is hard to read.
 *
 * Sources (verified 2026-08-10):
 *  - Flesch–Kincaid: https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests
 *  - Gunning fog:    https://en.wikipedia.org/wiki/Gunning_fog_index
 *  - Sentence length guidance: http://readabilityguidelines.wikidot.com/sentence-length
 *  - Plain language in finance: https://www.sec.gov/rules/final/33-7497.txt
 */

export interface ReadabilityStats {
  sentences: number;
  words: number;
  syllables: number;
  complexWords: number;
  /** Mean words per sentence. The single most actionable number here. */
  wordsPerSentence: number;
  /** Longest sentence in words. One monster sentence ruins a paragraph. */
  longestSentence: number;
  /** Sentences at or over LONG_SENTENCE_WORDS. */
  longSentences: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
}

/**
 * Target: plain English, readable by a 13–15 year old. That is the band the
 * Flesch table calls "Plain English" and it is the right target for a site whose
 * whole premise is that a complete beginner can start.
 */
export const TARGET_READING_EASE = 60;
export const TARGET_GRADE = 9;

/** Plain-language guidance puts the average here. */
export const TARGET_WORDS_PER_SENTENCE = 20;

/** A sentence this long has to be justified. Most cannot be. */
export const LONG_SENTENCE_WORDS = 32;

const VOWELS = 'aeiouy';

/**
 * Syllable counting, by heuristic.
 *
 * English orthography does not permit an exact algorithm without a dictionary.
 * This is the standard vowel-group approach with the usual corrections, and it
 * is wrong on perhaps 3–5% of words — which matters not at all for an average
 * over a few hundred words, and would matter a great deal if any single word's
 * count were load-bearing. Nothing here depends on a single word.
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;

  let count = 0;
  let prevWasVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = VOWELS.includes(w[i]);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }

  // A trailing silent "e" ("price", "trade") is not a syllable — unless
  // removing it would leave no vowel group at all ("the").
  //
  // "-le" is exempted rather than given a bonus syllable: in "candle" and
  // "settle" the vowel-group pass has already counted both, and adding one
  // more gave three. That was a real bug caught by the tests below.
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
  // "-ed" is usually silent ("charged"), except after t/d ("wanted", "traded").
  if (w.endsWith('ed') && w.length > 3 && !'td'.includes(w[w.length - 3]) && count > 1) count--;

  return Math.max(1, count);
}

/**
 * Splits into sentences.
 *
 * Deliberately naive, with one exception that matters for this corpus: a
 * decimal point is not a full stop. "0.025% of turnover" is one sentence, and
 * a splitter that disagrees reports a lesson full of one-word sentences and a
 * wonderful reading score.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/(\d)\.(\d)/g, '$1․$2') // Protect decimals with a one-dot leader.
    .replace(/\b([A-Z])\.\s?/g, '$1 ') // Initials: "T. Rowe" is not two sentences.
    // A line break is always a boundary in this corpus. Worked-example step
    // labels carry no full stop, so without this the whole list of steps reads
    // as one sentence — the first audit reported a 106-word monster that was
    // really eleven short labels.
    .split(/(?<=[.!?])[\s]+|\n+/)
    .map((s) => s.replace(/․/g, '.').trim())
    .filter((s) => /[a-z0-9]/i.test(s));
}

export function splitWords(text: string): string[] {
  return text
    .replace(/[—–]/g, ' ') // Em and en dashes separate words.
    .split(/[\s]+/)
    .map((w) => w.replace(/^[^\w₹%$]+|[^\w%]+$/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * Gunning fog counts words of three or more syllables as complex, excluding
 * proper nouns, familiar jargon, compound words, and words made long only by a
 * common suffix ("interesting" is not complex).
 *
 * Proper nouns and jargon are approximated: capitalised mid-sentence words are
 * treated as proper nouns, and any term in the glossary is treated as familiar
 * jargon — which is exactly right here, because a glossary term carries its own
 * definition on the page.
 */
export function isComplexWord(word: string, familiar: Set<string>): boolean {
  const bare = word.replace(/[^a-zA-Z-]/g, '');
  if (bare.length === 0) return false;
  if (familiar.has(bare.toLowerCase())) return false;
  // A capital anywhere but the first letter, or a hyphen, suggests a proper
  // noun or a compound. Both are excluded by the original definition.
  if (/[A-Z]/.test(bare.slice(1)) || bare.includes('-')) return false;

  const stripped = bare.toLowerCase().replace(/(es|ed|ing)$/, '');
  return countSyllables(stripped.length >= 3 ? stripped : bare) >= 3;
}

export function readability(text: string, familiar: Set<string> = new Set()): ReadabilityStats {
  const sentences = splitSentences(text);
  const perSentence = sentences.map((s) => splitWords(s).length);
  const words = splitWords(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const complexWords = words.filter((w) => isComplexWord(w, familiar)).length;

  const wps = wordCount / sentenceCount;
  const spw = wordCount === 0 ? 0 : syllables / wordCount;

  return {
    sentences: sentences.length,
    words: wordCount,
    syllables,
    complexWords,
    wordsPerSentence: wps,
    longestSentence: perSentence.length ? Math.max(...perSentence) : 0,
    longSentences: perSentence.filter((n) => n >= LONG_SENTENCE_WORDS).length,
    fleschReadingEase: 206.835 - 1.015 * wps - 84.6 * spw,
    fleschKincaidGrade: 0.39 * wps + 11.8 * spw - 15.59,
    gunningFog: 0.4 * (wps + 100 * (wordCount === 0 ? 0 : complexWords / wordCount)),
  };
}

/** A plain-English verdict, for the author-facing report. */
export function verdict(stats: ReadabilityStats): string {
  const ease = stats.fleschReadingEase;
  if (ease >= 80) return 'easy — conversational';
  if (ease >= 70) return 'fairly easy';
  if (ease >= 60) return 'plain English';
  if (ease >= 50) return 'fairly difficult';
  if (ease >= 30) return 'difficult — college level';
  return 'very difficult';
}
