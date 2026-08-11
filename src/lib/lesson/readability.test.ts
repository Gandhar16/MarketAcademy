import { describe, expect, it } from 'vitest';
import {
  countSyllables,
  isComplexWord,
  readability,
  splitSentences,
  splitWords,
  verdict,
} from './readability';

describe('syllable counting', () => {
  it('handles the ordinary cases', () => {
    for (const [word, n] of [
      ['a', 1],
      ['the', 1],
      ['share', 1],
      ['price', 1],
      ['broker', 2],
      ['market', 2],
      ['settlement', 3],
      ['volatility', 5],
    ] as [string, number][]) {
      expect(countSyllables(word), word).toBe(n);
    }
  });

  it('does not count a silent trailing e', () => {
    expect(countSyllables('trade')).toBe(1);
    expect(countSyllables('quote')).toBe(1);
  });

  it('counts -le as its own syllable after a consonant', () => {
    expect(countSyllables('candle')).toBe(2);
    expect(countSyllables('settle')).toBe(2);
  });

  it('treats -ed as silent except after t or d', () => {
    expect(countSyllables('charged')).toBe(1);
    expect(countSyllables('traded')).toBe(2);
  });

  it('never returns zero for a real word', () => {
    for (const w of ['rhythm', 'strength', 'x', 'NSE']) expect(countSyllables(w)).toBeGreaterThan(0);
  });

  it('ignores punctuation and digits', () => {
    expect(countSyllables('₹1,400')).toBe(0);
    expect(countSyllables('"broker,"')).toBe(2);
  });
});

describe('sentence splitting', () => {
  it('splits on terminal punctuation', () => {
    expect(splitSentences('One. Two! Three?')).toHaveLength(3);
  });

  it('does not split a decimal number', () => {
    // This is the one that matters. "0.025% of turnover" split in two would
    // report a lesson full of tiny sentences and a wonderful reading score.
    const s = splitSentences('STT is 0.025% of turnover. That is charged on the sell.');
    expect(s).toHaveLength(2);
    expect(s[0]).toContain('0.025%');
  });

  it('survives a paragraph of real lesson prose', () => {
    const text =
      'A stop is not a guarantee of price. It is a trigger: once hit, it becomes an ordinary order and fills wherever the market is.';
    expect(splitSentences(text)).toHaveLength(2);
  });

  it('ignores empty fragments', () => {
    expect(splitSentences('One.   \n\n  ')).toHaveLength(1);
  });
});

describe('word splitting', () => {
  it('keeps currency and percentages intact', () => {
    expect(splitWords('You pay ₹1,400 and 0.1% of it.')).toContain('₹1,400');
    expect(splitWords('You pay ₹1,400 and 0.1% of it.')).toContain('0.1%');
  });

  it('treats an em dash as a separator, not a word', () => {
    expect(splitWords('one — two')).toEqual(['one', 'two']);
  });
});

describe('complex words', () => {
  const familiar = new Set(['depository']);

  it('counts three-syllable words', () => {
    expect(isComplexWord('settlement', new Set())).toBe(true);
  });

  it('strips a common suffix before deciding, so "trading" is not complex', () => {
    // Gunning's definition excludes words made long only by -es/-ed/-ing.
    // Implemented by stripping the suffix and then counting: "trading" becomes
    // "trad" (1) and is not complex; "settlement" keeps 3 and is.
    //
    // The textbook example for this rule is "interesting", which the original
    // calls non-complex. That depends on pronouncing it in-t'rest-ing, and no
    // suffix-stripping rule reproduces it — in-ter-est is three syllables on
    // its own. The rule is implemented; that one example is not asserted.
    expect(isComplexWord('trading', new Set())).toBe(false);
    expect(isComplexWord('charged', new Set())).toBe(false);
    expect(isComplexWord('settlement', new Set())).toBe(true);
  });

  it('excludes glossary terms as familiar jargon', () => {
    // Right for this site specifically: a glossary term carries its own
    // definition on the page, so it is not the barrier the metric assumes.
    expect(isComplexWord('depository', new Set())).toBe(true);
    expect(isComplexWord('depository', familiar)).toBe(false);
  });

  it('excludes proper nouns and compounds', () => {
    expect(isComplexWord('Reliance', new Set())).toBe(false);
    expect(isComplexWord('break-even', new Set())).toBe(false);
  });

  it('does not count short words', () => {
    expect(isComplexWord('order', new Set())).toBe(false);
  });
});

describe('the formulas match their published definitions', () => {
  it('computes Flesch Reading Ease from the standard coefficients', () => {
    // One sentence, five one-syllable words: 206.835 − 1.015(5) − 84.6(1).
    const stats = readability('The dog ran up hill.');
    expect(stats.words).toBe(5);
    expect(stats.sentences).toBe(1);
    expect(stats.fleschReadingEase).toBeCloseTo(206.835 - 1.015 * 5 - 84.6 * (stats.syllables / 5), 4);
  });

  it('computes the grade level from the standard coefficients', () => {
    const stats = readability('The dog ran up hill.');
    expect(stats.fleschKincaidGrade).toBeCloseTo(0.39 * 5 + 11.8 * (stats.syllables / 5) - 15.59, 4);
  });

  it('computes fog from the standard coefficients', () => {
    const stats = readability('The dog ran up hill.');
    expect(stats.gunningFog).toBeCloseTo(0.4 * (5 + 100 * (stats.complexWords / 5)), 4);
  });

  it('ranks obviously simple prose above obviously dense prose', () => {
    const simple = readability('A share is a slice of a company. Buy one and you own a bit of it.');
    const dense = readability(
      'Notwithstanding the aforementioned considerations regarding settlement obligations, the counterparty ' +
        'retains discretionary authority concerning the determination of applicable collateralisation requirements.',
    );
    expect(simple.fleschReadingEase).toBeGreaterThan(dense.fleschReadingEase);
    expect(simple.fleschKincaidGrade).toBeLessThan(dense.fleschKincaidGrade);
    expect(simple.gunningFog).toBeLessThan(dense.gunningFog);
  });
});

describe('sentence-length reporting', () => {
  it('reports the longest sentence and how many are long', () => {
    const long = `This is ${'word '.repeat(40)}end.`;
    const stats = readability(`Short one. ${long}`);
    expect(stats.longestSentence).toBeGreaterThan(35);
    expect(stats.longSentences).toBe(1);
  });

  it('handles empty input without dividing by zero', () => {
    const stats = readability('');
    expect(Number.isFinite(stats.fleschReadingEase)).toBe(true);
    expect(stats.words).toBe(0);
  });
});

describe('verdict', () => {
  it('names the band the score falls in', () => {
    expect(verdict(readability('A share is a slice of a firm. You own part of it.'))).toMatch(/easy|plain/);
  });
});
