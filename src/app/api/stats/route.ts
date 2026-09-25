import { NextResponse } from 'next/server';
import { query } from '@/lib/dbClient';
import { checkTimetableValidity } from '@/lib/prayerTracker';

export async function GET() {
  try {
    const totalMosquesRes = await query<{ count: string }>('SELECT COUNT(*) FROM mosques;');
    const totalMosques = parseInt(totalMosquesRes[0]?.count || '0', 10);

    const prayerRows = await query<{
      id: number;
      mosque_id: number;
      updated_date: string;
      next_update_date: string;
    }>('SELECT id, mosque_id, updated_date, next_update_date FROM prayer_times;');

    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const p of prayerRows) {
      const v = checkTimetableValidity(p.updated_date, p.next_update_date);
      if (v.status === 'expired') {
        expiredCount++;
      } else if (v.status === 'expiring_soon') {
        expiringSoonCount++;
      } else {
        activeCount++;
      }
    }

    const divisionStats = await query<{ division: string; count: string }>(`
      SELECT division, COUNT(*) as count 
      FROM mosques 
      GROUP BY division 
      ORDER BY count DESC;
    `);

    const recentLogs = await query<{
      id: number;
      mosque_id: number;
      action: string;
      details: string;
      performed_at: string;
    }>(`
      SELECT id, mosque_id, action, details, performed_at 
      FROM timetable_logs 
      ORDER BY id DESC 
      LIMIT 10;
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalMosques,
        activeCount,
        expiringSoonCount,
        expiredCount,
        divisionStats,
        recentLogs
      }
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
