import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Whole Donuts Merch Platform',
  description: 'Sponsor merch management and referrals dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,126,33,0.25),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)]">
          {children}
        </div>
      </body>
    </html>
  );
}
