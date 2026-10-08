import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbClient';
import { verifyAdminAuth, sanitizeString } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Server-side Authorization Check
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required to update prayer timetable' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const mosqueId = parseInt(id, 10);

    if (isNaN(mosqueId)) {
      return NextResponse.json({ success: false, error: 'Invalid mosque ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      jummah,
      image,
      validity_days,
      is_verified,
      ocr_raw_text
    } = body;

    const days = parseInt(validity_days || '15', 10);
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Sanitize string inputs
    const cleanFajr = fajr !== undefined ? sanitizeString(fajr) : null;
    const cleanDhuhr = dhuhr !== undefined ? sanitizeString(dhuhr) : null;
    const cleanAsr = asr !== undefined ? sanitizeString(asr) : null;
    const cleanMaghrib = maghrib !== undefined ? sanitizeString(maghrib) : null;
    const cleanIsha = isha !== undefined ? sanitizeString(isha) : null;
    const cleanJummah = jummah !== undefined ? sanitizeString(jummah) : null;
    const cleanImage = image !== undefined ? sanitizeString(image) : null;
    const cleanOcr = ocr_raw_text !== undefined ? sanitizeString(ocr_raw_text) : null;

    // Check if prayer row exists
    const existing = await query<Record<string, unknown>>(
      'SELECT id, image FROM prayer_times WHERE mosque_id = $1 LIMIT 1;',
      [mosqueId]
    );

    let updatedRecord;
    if (existing.length > 0) {
      const updateSql = `
        UPDATE prayer_times
        SET 
          fajr = COALESCE($1, fajr),
          dhuhr = COALESCE($2, dhuhr),
          asr = COALESCE($3, asr),
          maghrib = COALESCE($4, maghrib),
          isha = COALESCE($5, isha),
          jummah = COALESCE($6, jummah),
          image = COALESCE($7, image),
          updated_date = $8,
          next_update_date = $9,
          is_verified = COALESCE($10, is_verified),
          ocr_raw_text = COALESCE($11, ocr_raw_text)
        WHERE mosque_id = $12
        RETURNING *;
      `;
      const res = await query(updateSql, [
        cleanFajr,
        cleanDhuhr,
        cleanAsr,
        cleanMaghrib,
        cleanIsha,
        cleanJummah,
        cleanImage,
        now,
        nextUpdate,
        is_verified !== undefined ? is_verified : true,
        cleanOcr,
        mosqueId
      ]);
      updatedRecord = res[0];
    } else {
      const insertSql = `
        INSERT INTO prayer_times (
          mosque_id, fajr, dhuhr, asr, maghrib, isha, jummah,
          image, updated_date, next_update_date, is_verified, ocr_raw_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const res = await query(insertSql, [
        mosqueId,
        cleanFajr || '05:10 AM',
        cleanDhuhr || '01:15 PM',
        cleanAsr || '04:25 PM',
        cleanMaghrib || '06:10 PM',
        cleanIsha || '08:00 PM',
        cleanJummah || '01:30 PM',
        cleanImage || '/images/charts/baitul_aman_chart.svg',
        now,
        nextUpdate,
        true,
        cleanOcr
      ]);
      updatedRecord = res[0];
    }

    // Log the timetable update
    await query(
      `INSERT INTO timetable_logs (mosque_id, action, details, chart_image) VALUES ($1, $2, $3, $4);`,
      [
        mosqueId,
        'UPDATE_TIMETABLE',
        `Admin verified and updated timetable: Fajr: ${cleanFajr}, Dhuhr: ${cleanDhuhr}, Asr: ${cleanAsr}, Maghrib: ${cleanMaghrib}, Isha: ${cleanIsha}, Jummah: ${cleanJummah}`,
        cleanImage
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Prayer timetable updated and verified successfully',
      prayer: updatedRecord
    });
  } catch (error) {
    console.error('Error in PUT /api/mosques/[id]/prayer:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
