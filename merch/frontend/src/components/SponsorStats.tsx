type SponsorStatsProps = {
  clicks: number;
  shares: number;
  conversions: number;
  effortScore: number;
  discountEarned: number;
};

const cards = [
  { key: 'clicks', label: 'Clicks' },
  { key: 'shares', label: 'Shares' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'effortScore', label: 'Effort score' },
  { key: 'discountEarned', label: 'Discount earned' },
] as const;

export function SponsorStats({ clicks, shares, conversions, effortScore, discountEarned }: SponsorStatsProps) {
  const values = {
    clicks,
    shares,
    conversions,
    effortScore,
    discountEarned: `${(discountEarned * 100).toFixed(0)}%`,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-card">
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{values[card.key]}</p>
        </div>
      ))}
    </div>
  );
}
