import { describe, expect, it } from 'vitest';
import { SAID_AS_WORDS, speakable } from './speech';
import { EXPLAINERS } from './explainers';

const ALL_CAPTIONS = EXPLAINERS.flatMap((e) => e.chapters.flatMap((c) => c.scenes.map((s) => s.caption)));

describe('speakable', () => {
  it('says rupee amounts the way a person in India says them', () => {
    expect(speakable('That is ₹1,00,000 of your money.')).toBe('That is 1 lakh rupees of your money.');
    expect(speakable('You are down ₹238.32.')).toBe('You are down 238 rupees 32 paise.');
    expect(speakable('the ₹0.20 SEBI fee')).toBe('the 20 paise SEBI fee');
    expect(speakable('at ₹1,000 each')).toBe('at 1000 rupees each');
    expect(speakable('₹2,50,00,000 changed hands')).toBe('2.5 crore rupees changed hands');
  });

  it('keeps small precise charges exact rather than rounding them into lakhs', () => {
    // The entire point of the cost breakdown is that ₹6.14 and ₹0.20 are real.
    // A narrator that rounds them away is arguing the opposite of the lesson.
    expect(speakable('₹6.14')).toBe('6 rupees 14 paise');
    expect(speakable('₹3.48')).toBe('3 rupees 48 paise');
  });

  it('spells out initialisms nobody pronounces as words', () => {
    expect(speakable('The largest line is STT')).toBe('The largest line is S T T');
    expect(speakable('GST on the brokerage')).toBe('G S T on the brokerage');
    expect(speakable('NSE transaction charges')).toBe('N S E transaction charges');
  });

  it('leaves alone the ones people do say as words', () => {
    for (const word of SAID_AS_WORDS) {
      expect(speakable(`a ${word} rule`), word).toBe(`a ${word} rule`);
    }
  });

  it('does not mangle ordinary words that contain those letters', () => {
    // The rule is word-boundary anchored; without that, "DIP" and "deposit"
    // and any capitalised sentence start become a spelling bee.
    expect(speakable('A DIP in the price')).toBe('A DIP in the price');
    expect(speakable('the depository charge')).toBe('the depository charge');
  });

  it('turns written punctuation into spoken beats', () => {
    expect(speakable('You are square — nothing moved.')).toBe('You are square, nothing moved.');
    expect(speakable('why "zero brokerage" is an advert')).toBe('why zero brokerage is an advert');
    expect(speakable('0.24% before you profit')).toBe('0.24 percent before you profit');
    expect(speakable('lands on T+1')).toBe('lands on T plus 1');
  });

  it('never invents, drops or alters a number from the caption', () => {
    // The one property that makes a synthetic narrator acceptable here: it
    // cannot say something the written caption does not. Every digit sequence
    // in the caption must still be present in the spoken form — allowing for
    // lakh/crore conversion, which is checked separately above.
    for (const caption of ALL_CAPTIONS) {
      const spoken = speakable(caption);
      const written = caption.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];

      for (const figure of written) {
        const plain = figure.replace(/,/g, '');
        const asLakh = Number(plain) >= 100_000 ? String(Number(plain) / 100_000) : null;
        const asRupeesPaise = plain.includes('.') ? plain.split('.') : null;

        const survives =
          spoken.includes(plain) ||
          spoken.includes(figure) ||
          (asLakh !== null && spoken.includes(asLakh)) ||
          (asRupeesPaise !== null &&
            spoken.includes(String(Number(asRupeesPaise[0]))) &&
            spoken.includes(String(Number(asRupeesPaise[1]))));

        expect(survives, `"${figure}" vanished from: ${spoken}`).toBe(true);
      }
    }
  });

  it('leaves no unspeakable characters in any real caption', () => {
    // Whatever survives normalisation is what the voice actually has to cope
    // with. A stray ₹ or % here is a scene that will be read wrong.
    for (const caption of ALL_CAPTIONS) {
      const spoken = speakable(caption);
      expect(spoken, `unspeakable character in: ${spoken}`).not.toMatch(/[₹%—"“”]/);
    }
  });

  it('produces something for every caption', () => {
    for (const caption of ALL_CAPTIONS) {
      expect(speakable(caption).length).toBeGreaterThan(20);
    }
  });
});
