'use client';

/**
 * A scroll-triggered fade + rise-in, the "AOS-style" entrance effect the rest
 * of the site's high-traffic surfaces use. Built on framer-motion — already a
 * dependency — rather than adding AOS, so it composes as a normal React
 * component instead of a second DOM-scanning library fighting Next's render
 * cycle.
 *
 * `viewport={{ once: true }}` — content reveals once, on first scroll into
 * view, and stays. Re-triggering on every scroll up/down reads as flickery on
 * a content-heavy site like this one, not "modern".
 *
 * Reduced motion: framer-motion's `useReducedMotion` reflects the same OS
 * setting `globals.css`'s `prefers-reduced-motion` media query already
 * forces every CSS transition/animation to ~0 for. Mirroring that decision
 * here (rather than trusting the CSS override alone) also removes the
 * transform/opacity offset itself, so a reduced-motion user never sees
 * content sitting invisible-until-scroll — it is simply present immediately.
 */
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = 'div',
}: {
  children: ReactNode;
  /** Seconds to hold before starting — use in small increments (0.05–0.15) for a stagger-by-hand feel. */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  const variants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } };

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
