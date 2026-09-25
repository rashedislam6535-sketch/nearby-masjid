import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbClient';
import { calculateDistance } from '@/lib/geoUtils';
import { checkTimetableValidity } from '@/lib/prayerTracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const division = searchParams.get('division');
    const search = searchParams.get('search');
    const expiredOnly = searchParams.get('expiredOnly') === 'true';

    let sql = `
      SELECT 
        m.id,
        m.mosque_name_bn,
        m.mosque_name_en,
        m.image,
        m.address,
        m.division,
        m.district,
        m.upazila,
        m.union_name,
        m.latitude,
        m.longitude,
        m.contact,
        m.created_at,
        p.id as prayer_id,
        p.fajr,
        p.dhuhr,
        p.asr,
        p.maghrib,
        p.isha,
        p.jummah,
        p.image as prayer_chart_image,
        p.updated_date,
        p.next_update_date,
        p.is_verified,
        p.ocr_raw_text
      FROM mosques m
      LEFT JOIN prayer_times p ON m.id = p.mosque_id
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (division && division !== 'All') {
      sql += ` AND m.division ILIKE $${paramIndex}`;
      params.push(division);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (m.mosque_name_bn ILIKE $${paramIndex} OR m.mosque_name_en ILIKE $${paramIndex} OR m.address ILIKE $${paramIndex} OR m.upazila ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY m.id ASC;`;

    const rows = await query<Record<string, unknown>>(sql, params);

    const userLat = latParam ? parseFloat(latParam) : null;
    const userLng = lngParam ? parseFloat(lngParam) : null;

    const mosquesWithDetails = rows.map((r) => {
      let distanceMeters: number | undefined = undefined;
      let distanceText: string | undefined = undefined;

      const mosqueLat = Number(r.latitude);
      const mosqueLng = Number(r.longitude);

      if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
        const dist = calculateDistance(userLat, userLng, mosqueLat, mosqueLng);
        distanceMeters = dist.meters;
        distanceText = dist.text;
      }

      const validity = checkTimetableValidity(
        r.updated_date as string | undefined,
        r.next_update_date as string | undefined
      );

      return {
        id: r.id,
        mosque_name_bn: r.mosque_name_bn,
        mosque_name_en: r.mosque_name_en,
        image: r.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        address: r.address,
        division: r.division,
        district: r.district,
        upazila: r.upazila,
        union_name: r.union_name,
        latitude: mosqueLat,
        longitude: mosqueLng,
        contact: r.contact,
        created_at: r.created_at,
        distance_meters: distanceMeters,
        distance_text: distanceText,
        prayer: {
          id: r.prayer_id,
          mosque_id: r.id,
          fajr: r.fajr || '05:10 AM',
          dhuhr: r.dhuhr || '01:15 PM',
          asr: r.asr || '04:25 PM',
          maghrib: r.maghrib || '06:10 PM',
          isha: r.isha || '08:00 PM',
          jummah: r.jummah || '01:30 PM',
          image: r.prayer_chart_image,
          updated_date: r.updated_date,
          next_update_date: r.next_update_date,
          is_verified: r.is_verified ?? true,
          validity_status: validity.status,
          days_remaining: validity.daysRemaining,
          validity_message: validity.message,
          ocr_raw_text: r.ocr_raw_text
        }
      };
    });

    let filtered = mosquesWithDetails;
    if (expiredOnly) {
      filtered = filtered.filter(m => m.prayer.validity_status === 'expired');
    }

    // Sort by distance if user coordinates provided
    if (userLat !== null && userLng !== null) {
      filtered.sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      mosques: filtered
    });
  } catch (error) {
    console.error('Error in GET /api/mosques:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mosque_name_bn,
      mosque_name_en,
      image,
      address,
      division,
      district,
      upazila,
      union_name,
      latitude,
      longitude,
      contact,
      prayer
    } = body;

    if (!mosque_name_bn || !mosque_name_en || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required mosque information' },
        { status: 400 }
      );
    }

    const insertMosqueSql = `
      INSERT INTO mosques (
        mosque_name_bn, mosque_name_en, image, address,
        division, district, upazila, union_name,
        latitude, longitude, contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const mosqueRows = await query<Record<string, unknown>>(insertMosqueSql, [
      mosque_name_bn,
      mosque_name_en,
      image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      address,
      division || 'Dhaka',
      district || 'Dhaka',
      upazila || 'Mirpur',
      union_name || null,
      parseFloat(latitude),
      parseFloat(longitude),
      contact || null
    ]);

    const createdMosque = mosqueRows[0];
    const mosqueId = createdMosque.id;

    // Create initial prayer schedule
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const fajr = prayer?.fajr || '05:10 AM';
    const dhuhr = prayer?.dhuhr || '01:15 PM';
    const asr = prayer?.asr || '04:25 PM';
    const maghrib = prayer?.maghrib || '06:10 PM';
    const isha = prayer?.isha || '08:00 PM';
    const jummah = prayer?.jummah || '01:30 PM';
    const chartImage = prayer?.image || '/images/charts/baitul_aman_chart.svg';

    const insertPrayerSql = `
      INSERT INTO prayer_times (
        mosque_id, fajr, dhuhr, asr, maghrib, isha, jummah,
        image, updated_date, next_update_date, is_verified, ocr_raw_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    await query(insertPrayerSql, [
      mosqueId,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      jummah,
      chartImage,
      now,
      nextUpdate,
      true,
      prayer?.ocr_raw_text || null
    ]);

    // Log action
    await query(
      `INSERT INTO timetable_logs (mosque_id, action, details, chart_image) VALUES ($1, $2, $3, $4);`,
      [mosqueId, 'CREATE_MOSQUE', `Created mosque ${mosque_name_en}`, chartImage]
    );

    return NextResponse.json({
      success: true,
      message: 'Mosque and prayer timetable created successfully',
      mosqueId
    });
  } catch (error) {
    console.error('Error in POST /api/mosques:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
