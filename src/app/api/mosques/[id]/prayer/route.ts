import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbClient';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        fajr,
        dhuhr,
        asr,
        maghrib,
        isha,
        jummah,
        image || null,
        now,
        nextUpdate,
        is_verified !== undefined ? is_verified : true,
        ocr_raw_text || null,
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
        fajr || '05:10 AM',
        dhuhr || '01:15 PM',
        asr || '04:25 PM',
        maghrib || '06:10 PM',
        isha || '08:00 PM',
        jummah || '01:30 PM',
        image || '/images/charts/baitul_aman_chart.svg',
        now,
        nextUpdate,
        true,
        ocr_raw_text || null
      ]);
      updatedRecord = res[0];
    }

    // Log the timetable update
    await query(
      `INSERT INTO timetable_logs (mosque_id, action, details, chart_image) VALUES ($1, $2, $3, $4);`,
      [
        mosqueId,
        'UPDATE_TIMETABLE',
        `Admin verified and updated timetable: Fajr: ${fajr}, Dhuhr: ${dhuhr}, Asr: ${asr}, Maghrib: ${maghrib}, Isha: ${isha}, Jummah: ${jummah}`,
        image || null
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
