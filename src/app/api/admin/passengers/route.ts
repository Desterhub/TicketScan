import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';
import { aggregatePassengerProfiles, PassengerProfile } from '@/lib/passenger-intelligence';
import { Ticket } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const mode = (searchParams.get('mode') || 'all').toLowerCase();
    const sort = searchParams.get('sort') || 'expenditure'; // 'expenditure' | 'trips' | 'name' | 'recent'
    const passengerId = searchParams.get('id');

    // Fetch all tickets
    const supabase = getServiceRoleClient();
    let allTickets: Ticket[] = [];

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        allTickets = data as Ticket[];
      }
    } catch (dbErr) {
      console.warn('Supabase fetch failed, attempting local store fallback:', dbErr);
    }

    if (allTickets.length === 0) {
      const { localDb } = await import('@/lib/local-store');
      allTickets = localDb.getTickets();
    }

    // Build linked passenger profiles
    let profiles = aggregatePassengerProfiles(allTickets);

    // If querying single passenger by id
    if (passengerId) {
      const profile = profiles.find((p) => p.id === passengerId || p.normalizedKey === passengerId);
      if (!profile) {
        return NextResponse.json({ error: 'Passenger profile not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, passenger: profile });
    }

    // Filter by mode
    if (mode !== 'all') {
      profiles = profiles.filter((p) => {
        if (mode === 'flight') return p.modes.flight > 0;
        if (mode === 'train') return p.modes.train > 0;
        if (mode === 'bus') return p.modes.bus > 0;
        return true;
      });
    }

    // Search query filter
    if (query) {
      profiles = profiles.filter((p) => {
        const nameMatch = p.fullName.toLowerCase().includes(query) || p.canonicalName.toLowerCase().includes(query);
        const journeyMatch = p.journeys.some(
          (j) =>
            j.pnr.toLowerCase().includes(query) ||
            j.carrierName.toLowerCase().includes(query) ||
            j.origin.toLowerCase().includes(query) ||
            j.destination.toLowerCase().includes(query) ||
            j.seat.toLowerCase().includes(query)
        );
        return nameMatch || journeyMatch;
      });
    }

    // Sorting
    if (sort === 'trips') {
      profiles.sort((a, b) => b.totalJourneys - a.totalJourneys || b.totalExpenditure - a.totalExpenditure);
    } else if (sort === 'name') {
      profiles.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sort === 'recent') {
      profiles.sort((a, b) => new Date(b.latestJourneyDate).getTime() - new Date(a.latestJourneyDate).getTime());
    } else {
      // Default: expenditure descending
      profiles.sort((a, b) => b.totalExpenditure - a.totalExpenditure || b.totalJourneys - a.totalJourneys);
    }

    // Overall summary statistics
    const totalUnique = profiles.length;
    let totalExpenditureAll = 0;
    profiles.forEach((p) => {
      totalExpenditureAll += p.totalExpenditure;
    });

    const avgSpend = totalUnique > 0 ? totalExpenditureAll / totalUnique : 0;
    const topTraveler = profiles[0] || null;

    return NextResponse.json({
      success: true,
      passengers: profiles,
      stats: {
        totalUniquePassengers: totalUnique,
        totalExpenditure: totalExpenditureAll,
        totalExpenditureFormatted: `₹${totalExpenditureAll.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        averageExpenditure: avgSpend,
        averageExpenditureFormatted: `₹${avgSpend.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        topTraveler: topTraveler
          ? {
              name: topTraveler.fullName,
              expenditure: topTraveler.totalExpenditureFormatted,
              journeys: topTraveler.totalJourneys,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/passengers:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
