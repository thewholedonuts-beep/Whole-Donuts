'use client';

import { useState } from 'react';

type ReferralCardProps = {
  code: string;
  tier: string;
  discountEarned: number;
};

export function ReferralCard({ code, tier, discountEarned }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-3xl border border-brand-400/20 bg-slate-900/80 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Referral code</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{code}</h3>
          <p className="mt-3 text-sm text-slate-300">
            Sponsor tier: <span className="font-semibold capitalize text-brand-200">{tier}</span>
          </p>
          <p className="text-sm text-slate-300">Discount earned: {(discountEarned * 100).toFixed(0)}%</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
        >
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
    </div>
  );
}
