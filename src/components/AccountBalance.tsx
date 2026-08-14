'use client';

/**
 * The account balance, always visible in the header — not something you have
 * to open a game or the account page to see. It hydrates itself on mount and
 * otherwise just reads the shared store, so whichever game or RunSubmit last
 * wrote a fresh net P&L is what shows up here, with no polling.
 */
import { useEffect } from 'react';
import { useAccountStore } from '@/lib/account/store';

/**
 * Only ever rendered inside `AccountLinks` once the server has already
 * confirmed a signed-in `displayName`, so "am I signed in" is not this
 * component's question — it only has to wait out the one client fetch that
 * turns that fact into an actual number.
 */
export function AccountBalance() {
  const { startingCash, status, hydrate } = useAccountStore();

  useEffect(() => {
    if (status === 'idle') void hydrate();
  }, [status, hydrate]);

  if (status !== 'ready') return null;

  return (
    <span className="num shrink-0 text-[13px] text-ink-muted" title="Your trading account balance">
      ₹{Math.round(startingCash).toLocaleString('en-IN')}
    </span>
  );
}
