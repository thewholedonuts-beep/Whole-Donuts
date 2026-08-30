'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ReferralCard } from '@/components/ReferralCard';
import { SponsorStats } from '@/components/SponsorStats';
import { apiRequest } from '@/lib/api';

type DashboardResponse = {
  sponsor: {
    id: string;
    name: string;
    tier: string;
    referral_code: string;
    discount_earned: number;
    effort_score: number;
  };
  analytics: {
    clicks: number;
    shares: number;
    conversions: number;
    effortScore: number;
    discountEarned: number;
  };
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total: number;
    fulfillment_status: string;
    created_at: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await apiRequest<DashboardResponse>('/sponsors/me/dashboard');
        setData(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Sponsor dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">
            {data ? `Welcome back, ${data.sponsor.name}` : 'Whole Donuts sponsor hub'}
          </h1>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 hover:border-brand-300" href="/dashboard/products">
            Products
          </Link>
          <Link className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 hover:border-brand-300" href="/dashboard/orders">
            Orders
          </Link>
        </nav>
      </header>

      {error && <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

      {data && (
        <div className="mt-10 space-y-8">
          <ReferralCard code={data.sponsor.referral_code} tier={data.sponsor.tier} discountEarned={data.analytics.discountEarned} />
          <SponsorStats {...data.analytics} />
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Recent orders</h2>
                <p className="mt-1 text-sm text-slate-400">Track sponsor-attributed order activity and status.</p>
              </div>
              <p className="text-sm text-brand-200">Effort score: {data.sponsor.effort_score.toFixed(2)}</p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-900">
                      <td className="py-3 pr-4">{order.customer_name}</td>
                      <td className="py-3 pr-4 capitalize">{order.fulfillment_status}</td>
                      <td className="py-3 pr-4">${Number(order.total).toFixed(2)}</td>
                      <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
