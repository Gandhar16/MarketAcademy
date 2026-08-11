import { describe, expect, it } from 'vitest';
import { annotateJargon, annotateLesson, annotateReveal, renderProse } from './annotate';
import type { Block } from './dsl';

const terms = (html: string) => [...html.matchAll(/data-term="([a-z0-9-]+)"/g)].map((m) => m[1]);

describe('annotateJargon', () => {
  it('wraps a glossary term', () => {
    const out = annotateJargon('Place a limit order instead.', new Set());
    expect(terms(out)).toEqual(['limit-order']);
    expect(out).toContain('>limit order</button>');
  });

  it('annotates each term only once', () => {
    const seen = new Set<string>();
    const first = annotateJargon('The spread is wide.', seen);
    const second = annotateJargon('The spread is still wide.', seen);
    expect(terms(first)).toEqual(['spread']);
    expect(terms(second)).toEqual([]);
  });

  it('preserves the reader\'s own capitalisation', () => {
    expect(annotateJargon('Liquidity matters.', new Set())).toContain('>Liquidity</button>');
  });

  it('prefers the longest matching phrase', () => {
    // Annotating "market order" as "order" would show the reader a definition
    // of the wrong thing entirely.
    expect(terms(annotateJargon('Send a market order.', new Set()))).toEqual(['market-order']);
  });

  it('respects word boundaries', () => {
    // "reordering" contains "order"; "askew" contains "ask".
    expect(terms(annotateJargon('Reordering askew borders.', new Set()))).toEqual([]);
  });

  it('never rewrites the inside of an HTML tag', () => {
    // `class="text-ink"` contains "ink"; an attribute must never be mangled.
    const out = annotateJargon('<strong class="text-ink font-medium">A share</strong> of it.', new Set());
    expect(out).toContain('<strong class="text-ink font-medium">');
    expect(terms(out)).toEqual(['share']);
  });

  it('leaves ordinary English alone', () => {
    // Every one of these was a real false positive caught by the glossary tests:
    // put/call/stop/gap/long/option are verbs and nouns long before they are
    // instruments, and a wrong definition is worse than none.
    const out = annotateJargon(
      'The money you put down, in order to call it a day, before the trading stops for a long while. ' +
        'Mind the gap. The first option is wrong.',
      new Set(),
    );
    expect(terms(out)).toEqual([]);
  });

  it('matches acronyms case-sensitively', () => {
    expect(terms(annotateJargon('You pay STT on it.', new Set()))).toEqual(['stt']);
    // Lowercase "stt" is not the tax; it is a typo or part of another word.
    expect(terms(annotateJargon('The word stt appears here.', new Set()))).toEqual([]);
  });

  it('escapes the aria-label rather than trusting the term text', () => {
    expect(annotateJargon('The bid is here.', new Set())).toMatch(/aria-label="What bid means"/);
  });

  it('is idempotent on already-annotated HTML', () => {
    const once = annotateJargon('The spread is wide.', new Set());
    const twice = annotateJargon(once, new Set());
    // The term is now inside a tag pair, so it is matched once more and no
    // nesting occurs — what matters is that the markup does not compound.
    expect(twice.match(/<button/g)?.length).toBe(1);
  });
});

describe('renderProse', () => {
  it('escapes HTML in the source before doing anything else', () => {
    const html = renderProse('A <script>alert(1)</script> tag.', new Set()).join('');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps bold and code working alongside annotation', () => {
    const html = renderProse('A **market order** and `code`.', new Set()).join('');
    expect(html).toContain('<strong');
    expect(html).toContain('<code');
    expect(terms(html)).toEqual(['market-order']);
  });

  it('splits on blank lines', () => {
    expect(renderProse('One.\n\nTwo.', new Set())).toHaveLength(2);
  });
});

describe('annotateLesson', () => {
  const prose = (md: string): Block => ({ kind: 'prose', md }) as Block;

  it('treats first occurrence as first in the LESSON, not in the paragraph', () => {
    const map = annotateLesson([prose('The spread is wide.'), prose('The spread is still wide.')]);
    expect(terms(map.get('The spread is wide.')!.join(''))).toEqual(['spread']);
    expect(terms(map.get('The spread is still wide.')!.join(''))).toEqual([]);
  });

  it('is pure — the same blocks always give the same output', () => {
    const blocks = [prose('The spread is wide.'), prose('A limit order rests.')];
    const a = annotateLesson(blocks);
    const b = annotateLesson(blocks);
    expect([...b.entries()]).toEqual([...a.entries()]);
  });

  it('covers example setups and conclusions, not only prose', () => {
    const example = {
      kind: 'example',
      title: 'T',
      setup: 'You send a market order into a thin book.',
      steps: [{ label: 'A', detail: 'B', value: '1' }],
      conclusion: 'Slippage is what you paid for the certainty.',
    } as unknown as Block;

    const map = annotateLesson([example]);
    expect(terms(map.get('You send a market order into a thin book.')!.join(''))).toContain('market-order');
    expect(terms(map.get('Slippage is what you paid for the certainty.')!.join(''))).toContain('slippage');
  });

  it('covers checkpoint explanations', () => {
    const checkpoint = {
      kind: 'checkpoint',
      tasks: [{ prompt: 'Decide.', type: 'decision', spec: {}, explanation: 'Because liquidity was thin.' }],
    } as unknown as Block;

    expect(terms(annotateLesson([checkpoint]).get('Because liquidity was thin.')!.join(''))).toContain('liquidity');
  });
});

describe('annotateReveal', () => {
  it('annotates independently, since a reveal arrives after the lesson pass', () => {
    // Deliberately allowed to repeat a term explained earlier — the reveal is
    // often the densest paragraph in a lesson and is worth annotating fully.
    expect(terms(annotateReveal('The spread is the cost.').join(''))).toEqual(['spread']);
  });
});
