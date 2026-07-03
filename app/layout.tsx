import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DB Prosthetics and Orthotics Ltd',
  description:
    "Nigeria's certified Prosthetics & Orthotics specialists — delivering precision care and custom prosthetic solutions across Nigeria.",
  keywords: ['prosthetics', 'orthotics', 'Nigeria', 'limb', 'rehabilitation'],
};

// Without this, mobile browsers render the page at a virtual desktop
// width (~980-1024px) and scale/clip it to fit the screen instead of
// laying out at the device's actual width — every mobile-specific CSS
// rule in the app (media queries, responsive grids, table-scroll
// wrappers) silently never activates as a result.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
