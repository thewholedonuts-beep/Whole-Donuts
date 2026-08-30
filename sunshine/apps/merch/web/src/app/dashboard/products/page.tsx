'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  description: string;
  final_price: number;
  category: string;
  inventory_count: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products')
      .then((response) => setProducts(response.products))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load products.'));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Catalog</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Sponsor-ready merch products</h1>
        </div>
        <Link href="/dashboard" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-brand-300">
          Back to dashboard
        </Link>
      </div>

      {error && <p className="mt-8 text-sm text-red-200">{error}</p>}

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-300">{product.category || 'Merch'}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{product.name}</h2>
            <p className="mt-3 text-sm text-slate-300">{product.description}</p>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
              <span>Inventory: {product.inventory_count}</span>
              <span className="text-lg font-semibold text-white">${Number(product.final_price).toFixed(2)}</span>
            </div>
            <Link
              href={`/dashboard/customize/${product.id}`}
              className="mt-6 inline-flex rounded-full bg-brand-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-brand-400"
            >
              Customize product
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
