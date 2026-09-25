import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mosqueId = parseInt(id, 10);

    if (isNaN(mosqueId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const rows = await query<Record<string, unknown>>(
      `
      SELECT 
        m.*,
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
      WHERE m.id = $1
      LIMIT 1;
    `,
      [mosqueId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Mosque not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, mosque: rows[0] });
  } catch (error) {
    console.error('Error in GET /api/mosques/[id]:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mosqueId = parseInt(id, 10);
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
      contact
    } = body;

    const updateSql = `
      UPDATE mosques
      SET 
        mosque_name_bn = COALESCE($1, mosque_name_bn),
        mosque_name_en = COALESCE($2, mosque_name_en),
        image = COALESCE($3, image),
        address = COALESCE($4, address),
        division = COALESCE($5, division),
        district = COALESCE($6, district),
        upazila = COALESCE($7, upazila),
        union_name = COALESCE($8, union_name),
        latitude = COALESCE($9, latitude),
        longitude = COALESCE($10, longitude),
        contact = COALESCE($11, contact),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *;
    `;

    const res = await query(updateSql, [
      mosque_name_bn,
      mosque_name_en,
      image,
      address,
      division,
      district,
      upazila,
      union_name,
      latitude !== undefined ? parseFloat(latitude) : null,
      longitude !== undefined ? parseFloat(longitude) : null,
      contact,
      mosqueId
    ]);

    if (res.length === 0) {
      return NextResponse.json({ success: false, error: 'Mosque not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, mosque: res[0] });
  } catch (error) {
    console.error('Error in PUT /api/mosques/[id]:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mosqueId = parseInt(id, 10);

    await query('DELETE FROM mosques WHERE id = $1;', [mosqueId]);

    return NextResponse.json({ success: true, message: 'Mosque deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/mosques/[id]:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
