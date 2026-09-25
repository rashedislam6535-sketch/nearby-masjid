import { NextResponse } from "next/server";
import { query } from "@/lib/dbClient";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "not_configured";
  let dbError: string | null = null;
  let mosquesCount = 0;
  let prayerTimesCount = 0;

  try {
    const mRes = await query<{ count: string }>("SELECT COUNT(*) FROM mosques;");
    const pRes = await query<{ count: string }>("SELECT COUNT(*) FROM prayer_times;");
    mosquesCount = parseInt(mRes[0]?.count || '0', 10);
    prayerTimesCount = parseInt(pRes[0]?.count || '0', 10);
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "error";
    dbError = (err as Error).message;
  }

  return NextResponse.json({
    ok: dbStatus === "connected",
    app: "Nearby Masjid",
    database: {
      status: dbStatus,
      error: dbError,
      mosques: mosquesCount,
      prayer_timetables: prayerTimesCount
    },
    version: "1.0.0-production-bd",
    timestamp: new Date().toISOString()
  });
}
