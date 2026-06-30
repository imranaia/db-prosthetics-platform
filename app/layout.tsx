import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'DB Prosthetics and Orthotics Ltd',
  description:
    "Nigeria's certified Prosthetics & Orthotics specialists — delivering precision care and custom prosthetic solutions across Nigeria.",
  keywords: ['prosthetics', 'orthotics', 'Nigeria', 'limb', 'rehabilitation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
