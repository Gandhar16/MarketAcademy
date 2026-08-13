'use client';

/**
 * A scroll-triggered stagger container for card grids (course cards, game
 * cards). Children opt in with `StaggerItem`; the parent orchestrates the
 * delay between them via framer-motion's `staggerChildren` rather than each
 * item computing its own offset, so reordering or resizing a grid never
 * requires touching a hand-written delay index.
 */
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div className={className} variants={itemVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
