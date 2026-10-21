import { IntroSplash } from '@/components/intro/IntroSplash';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TicketScan | AI-Powered Travel Ticket Extraction & Forensics',
  description:
    'Instant AI extraction and authenticity verification for train, flight, and bus tickets.',
};

export default function HomePage() {
  return (
    <main className="w-full min-h-screen bg-black overflow-hidden">
      <IntroSplash />
    </main>
  );
}
