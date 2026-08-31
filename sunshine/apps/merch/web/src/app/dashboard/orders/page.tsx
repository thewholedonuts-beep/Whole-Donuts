'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  fulfillment_status: string;
  referral_code_used: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await apiRequest<{ orders: Order[] }>('/orders');
        setOrders(response.orders);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load orders.');
      }
    }

    loadOrders();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Order operations</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">Manage sponsor-linked orders</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Track fulfillment, referral attribution, and customer activity from direct dashboard orders.
        </p>
      </div>

      {error && <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

      <div className="mt-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-card">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900">
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Referral</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-800/60 last:border-b-0">
                <td className="px-6 py-4">{order.customer_name}</td>
                <td className="px-6 py-4">{order.customer_email}</td>
                <td className="px-6 py-4 capitalize">{order.fulfillment_status}</td>
                <td className="px-6 py-4">{order.referral_code_used || '—'}</td>
                <td className="px-6 py-4">${Number(order.total).toFixed(2)}</td>
                <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
