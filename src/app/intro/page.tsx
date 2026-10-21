import { IntroSplash } from '@/components/intro/IntroSplash';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cinematic Experience | TicketScan',
  description: 'TicketScan intro cinematic portal animation',
};

export default function IntroPage() {
  return (
    <main className="w-full min-h-screen bg-black overflow-hidden">
      <IntroSplash forcePlay={true} />
    </main>
  );
}
