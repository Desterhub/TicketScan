import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = getServiceRoleClient();

    // 1. Total Users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    // 2. Total Tickets
    const { count: totalTickets } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true });

    // 3. Tickets this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: ticketsThisWeek } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo);

    // 4. All tickets for averages, flagged & total fare calculation
    let allTickets: any[] = [];
    try {
      const { data } = await supabase
        .from('tickets')
        .select('extraction_confidence, tamper_risk_score, created_at, transport_mode, raw_extraction_json, passenger_name');
      if (data && data.length > 0) allTickets = data;
    } catch {}

    let userCount = totalUsers;
    let ticketCount = totalTickets;

    if (allTickets.length === 0) {
      const { localDb } = await import('@/lib/local-store');
      allTickets = localDb.getTickets() as any;
      userCount = localDb.getUsers().length;
      ticketCount = allTickets.length;
    }

    let totalConfidence = 0;
    let confidenceCount = 0;
    let flaggedCount = 0;
    let totalFareNumeric = 0;
    let primaryCurrency = '₹';
    let totalPassengers = 0;

    const parseFare = (val: unknown): { amount: number; currency: string } => {
      if (typeof val === 'number') return { amount: val, currency: '₹' };
      if (!val || typeof val !== 'string') return { amount: 0, currency: '₹' };

      let currency = '₹';
      if (val.includes('$') || /USD/i.test(val)) currency = '$';
      else if (val.includes('€') || /EUR/i.test(val)) currency = '€';
      else if (val.includes('£') || /GBP/i.test(val)) currency = '£';
      else if (/AED/i.test(val)) currency = 'AED ';

      const clean = val.replace(/,/g, '');
      const match = clean.match(/(\d+(?:\.\d{1,2})?)/);
      const amount = match ? parseFloat(match[1]) : 0;
      return { amount: isNaN(amount) ? 0 : amount, currency };
    };

    // Daily breakdown for last 14-30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    if (allTickets) {
      allTickets.forEach((t: any) => {
        if (typeof t.extraction_confidence === 'number') {
          totalConfidence += Number(t.extraction_confidence);
          confidenceCount++;
        }
        if (t.tamper_risk_score && Number(t.tamper_risk_score) >= 0.3) {
          flaggedCount++;
        }
        const dateKey = t.created_at?.split('T')[0];
        if (dateKey && dailyMap[dateKey] !== undefined) {
          dailyMap[dateKey]++;
        }

        // Fares calculation across all manifested tickets
        const rawMeta = t.raw_extraction_json || {};
        const fareStr = rawMeta.total_fare || rawMeta.ticket_fare || t.total_fare;
        const parsed = parseFare(fareStr);
        if (parsed.amount > 0) {
          totalFareNumeric += parsed.amount;
          if (parsed.currency !== '₹') primaryCurrency = parsed.currency;
        }

        // Total passengers count
        if (Array.isArray(rawMeta.passengers) && rawMeta.passengers.length > 0) {
          totalPassengers += rawMeta.passengers.length;
        } else if (t.passenger_name) {
          totalPassengers += t.passenger_name.split(',').length;
        } else {
          totalPassengers += 1;
        }
      });
    }

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.94;

    const totalFareFormatted = `${primaryCurrency}${totalFareNumeric.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const chartData = Object.entries(dailyMap).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: userCount || 0,
        totalTickets: ticketCount || 0,
        totalFare: totalFareFormatted,
        totalFareRaw: totalFareNumeric,
        totalPassengers: totalPassengers || ticketCount || 0,
        ticketsThisWeek: ticketsThisWeek || 0,
        averageConfidence: Math.round(avgConfidence * 100),
        flaggedCount,
        chartData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
