'use client';

import { useMemo, useState } from 'react';

export type Product = {
  id: string;
  name: string;
  description: string;
  base_cost: number;
  markup_percent: number;
  final_price: number;
  print_methods: string[];
  available_colors: Array<{ name?: string; hex?: string }>;
};

type ProductCustomizerProps = {
  product: Product;
};

const placementOptions = ['front', 'back', 'left sleeve', 'right sleeve', 'chest'];

export function ProductCustomizer({ product }: ProductCustomizerProps) {
  const [logoPlacements, setLogoPlacements] = useState<string[]>(['front']);
  const [colorScheme, setColorScheme] = useState(product.available_colors?.[0]?.name || 'Classic');
  const [message, setMessage] = useState('');
  const [printMethod, setPrintMethod] = useState(product.print_methods?.[0] || 'embroidery');

  const pricing = useMemo(() => {
    const placementFee = logoPlacements.length * 3;
    const textFee = message.trim() ? Math.min(message.trim().length * 0.15, 5) : 0;
    const methodFee = { embroidery: 8, 'screen print': 5, DTG: 6 }[printMethod] ?? 0;
    const customizationCost = placementFee + textFee + methodFee;
    const subtotal = Number(product.base_cost) + customizationCost;
    const markupAmount = subtotal * (Number(product.markup_percent || 20) / 100);
    const finalPrice = subtotal + markupAmount;

    return {
      placementFee,
      textFee,
      methodFee,
      customizationCost,
      subtotal,
      markupAmount,
      finalPrice,
    };
  }, [logoPlacements, message, printMethod, product.base_cost, product.markup_percent]);

  function togglePlacement(value: string) {
    setLogoPlacements((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
        <div>
          <h2 className="text-3xl font-semibold text-white">Customize {product.name}</h2>
          <p className="mt-2 text-slate-300">{product.description}</p>
        </div>

        <section>
          <h3 className="text-lg font-medium text-brand-200">Logo placement</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {placementOptions.map((option) => {
              const active = logoPlacements.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePlacement(option)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-brand-400 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-brand-200">Color scheme</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(product.available_colors || []).map((color, index) => {
              const name = color.name || `Option ${index + 1}`;
              const active = colorScheme === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setColorScheme(name)}
                  className={`rounded-2xl border px-4 py-3 text-left ${
                    active ? 'border-brand-400 bg-brand-400/10' : 'border-slate-700 bg-slate-800/70'
                  }`}
                >
                  <span className="block font-medium text-white">{name}</span>
                  <span className="text-sm text-slate-400">{color.hex || 'Custom palette'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-brand-200">Message / text</h3>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Add campaign text, taglines, or initials"
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3 text-sm text-slate-950 outline-none ring-brand-300 focus:ring-2"
          />
        </section>

        <section>
          <h3 className="text-lg font-medium text-brand-200">Print method</h3>
          <select
            value={printMethod}
            onChange={(event) => setPrintMethod(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-100 px-4 py-3 text-sm text-slate-950 outline-none ring-brand-300 focus:ring-2"
          >
            {product.print_methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </section>
      </div>

      <div className="rounded-3xl border border-brand-400/20 bg-slate-900 p-6 shadow-card">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Price preview</p>
        <div className="mt-6 space-y-4 text-sm text-slate-200">
          <div className="flex justify-between"><span>Base cost</span><span>${Number(product.base_cost).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Customization</span><span>${pricing.customizationCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Markup ({Number(product.markup_percent || 20)}%)</span><span>${pricing.markupAmount.toFixed(2)}</span></div>
          <div className="border-t border-slate-800 pt-4 text-lg font-semibold text-white">
            <div className="flex justify-between"><span>Total preview</span><span>${pricing.finalPrice.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-slate-800/70 p-4 text-sm text-slate-300">
          <p>Selected color: <span className="font-medium text-white">{colorScheme}</span></p>
          <p className="mt-2">Placements: <span className="font-medium text-white">{logoPlacements.join(', ')}</span></p>
          <p className="mt-2">Method: <span className="font-medium text-white">{printMethod}</span></p>
        </div>
      </div>
    </div>
  );
}
