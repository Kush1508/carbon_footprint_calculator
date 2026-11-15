import type { Metadata, Viewport } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://carbonfootprintcalculator-two.vercel.app'),
  title: 'CLIMATE-LEDGER™ | Institutional Carbon Accounting & GHG Protocol Audit Suite',
  description:
    'Audit-grade, high-precision carbon accounting platform supporting Households, Farmers (IPCC Tier 1 AFOLU), and Corporate Enterprises (GHG Protocol Scopes 1-3 & GSF SCI). Validated for programmatic AI agent integration.',
  keywords: [
    'carbon accounting',
    'carbon footprint calculator',
    'GHG Protocol',
    'Scope 1 2 3 emissions',
    'IPCC Tier 1 agriculture',
    'enteric fermentation',
    'carbon credits',
    'Verra VCS',
    'Gold Standard',
    'BEE India Carbon Market',
    'GSF SCI green software',
    'ESG reporting',
  ],
  authors: [{ name: 'Climate-Ledger Engineering Team' }],
  creator: 'Climate-Ledger',
  publisher: 'Climate-Ledger',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://carbonfootprintcalculator-two.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://carbonfootprintcalculator-two.vercel.app',
    siteName: 'CLIMATE-LEDGER™',
    title: 'CLIMATE-LEDGER™ | Institutional Carbon Accounting & GHG Protocol Audit Suite',
    description:
      'High-precision institutional carbon accounting platform supporting Households, Farmers (IPCC Tier 1), and Corporate Scopes 1, 2, 3 with certified credit offsets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLIMATE-LEDGER™ | Institutional Carbon Accounting Suite',
    description:
      'Audit-grade carbon accounting web platform & API for Households, Agriculture (IPCC), and Corporate Scopes 1-3.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F3A2E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#F9FAFB] overflow-x-hidden w-full max-w-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#F9FAFB] text-zinc-900 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
