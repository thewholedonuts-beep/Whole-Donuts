'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';

type AuthResponse = {
  token: string;
  sponsor: {
    id: string;
    name: string;
  };
};

export default function HomePage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        await apiRequest('/sponsors/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Registration complete. You can now sign in.');
        setMode('login');
      } else {
        const response = await apiRequest<AuthResponse>('/sponsors/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('wd-token', response.token);
          localStorage.setItem('wd-sponsor-id', response.sponsor.id);
          localStorage.setItem('wd-sponsor-name', response.sponsor.name);
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-16 px-6 py-12 lg:flex-row lg:items-center">
      <section className="max-w-2xl">
        <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1 text-sm uppercase tracking-[0.3em] text-brand-200">
          Sponsor merch operations
        </span>
        <h1 className="mt-6 text-5xl font-semibold text-white sm:text-6xl">
          Launch and scale your Whole Donuts e-commerce merch program.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          Manage sponsor tiers, personalized merchandise, Shopify order sync, and fraud-aware referral campaigns from one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="rounded-full bg-slate-900/70 px-4 py-2">20% built-in markup</span>
          <span className="rounded-full bg-slate-900/70 px-4 py-2">Tier-based discounts</span>
          <span className="rounded-full bg-slate-900/70 px-4 py-2">Shopify + Printful ready</span>
        </div>
        <div className="mt-10 flex gap-4">
          <Link href="/dashboard/products" className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-brand-400">
            Browse products
          </Link>
          <Link href="/dashboard/orders" className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white transition hover:border-brand-300">
            View orders
          </Link>
        </div>
      </section>

      <section className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/85 p-8 shadow-card">
        <div className="flex gap-2 rounded-full bg-slate-800 p-1 text-sm">
          {(['login', 'register'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMode(type)}
              className={`flex-1 rounded-full px-4 py-2 font-medium capitalize transition ${
                mode === type ? 'bg-brand-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">Name</label>
              <input name="name" required className="w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3" />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input name="password" type="password" required minLength={8} className="w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3" />
          </div>
          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">Starting contribution (optional)</label>
              <input name="totalContribution" type="number" min="0" step="0.01" className="w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-brand-400 disabled:opacity-70">
            {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create sponsor account'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-brand-200">{message}</p>}
      </section>
    </main>
  );
}
