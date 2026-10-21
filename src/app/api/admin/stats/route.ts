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

    // 4. All tickets for averages & flagged calculation
    const { data: tickets } = await supabase
      .from('tickets')
      .select('extraction_confidence, tamper_risk_score, created_at, transport_mode');

    let totalConfidence = 0;
    let confidenceCount = 0;
    let flaggedCount = 0;

    // Daily breakdown for last 14-30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    if (tickets) {
      tickets.forEach((t) => {
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
      });
    }

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.94;

    const chartData = Object.entries(dailyMap).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalTickets: totalTickets || 0,
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
