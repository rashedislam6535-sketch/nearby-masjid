const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.mkmrifjcczeohsppqhni:W36W7Hv%3FP8B2hdt@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const BARISAL_MOSQUES = [
  {
    mosque_name_bn: 'গুঠিয়া বায়তুল আমান জামে মসজিদ কমপ্লেক্স',
    mosque_name_en: 'Guthia Baitul Aman Jame Masjid Complex',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    address: 'চাংগুরিয়া, গুঠিয়া, উজিরপুর, বরিশাল-৮২১০ (Guthia, Wazirpur)',
    division: 'Barisal',
    district: 'Barisal',
    upazila: 'Wazirpur',
    union_name: 'Guthia',
    latitude: 22.79810,
    longitude: 90.26420,
    contact: '+880 1712-445566',
    prayer: {
      fajr: '05:05 AM',
      dhuhr: '01:15 PM',
      asr: '04:25 PM',
      maghrib: '06:05 PM',
      isha: '08:00 PM',
      jummah: '01:30 PM',
      chart_image: '/images/charts/baitul_aman_chart.svg',
      updated_days_ago: 3,
      validity_days: 15
    }
  },
  {
    mosque_name_bn: 'বরিশাল কালেক্টরেট কেন্দ্রীয় জামে মসজিদ',
    mosque_name_en: 'Barisal Collectorate Central Jame Masjid',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    address: 'ফজলুল হক এভিনিউ, বরিশাল সদর, বরিশাল-৮২০০ (Collectorate Square)',
    division: 'Barisal',
    district: 'Barisal',
    upazila: 'Barisal Sadar',
    union_name: 'Ward 10',
    latitude: 22.70550,
    longitude: 90.36800,
    contact: '+880 1711-889900',
    prayer: {
      fajr: '05:05 AM',
      dhuhr: '01:15 PM',
      asr: '04:25 PM',
      maghrib: '06:05 PM',
      isha: '08:00 PM',
      jummah: '01:30 PM',
      chart_image: '/images/charts/noor_masjid_chart.svg',
      updated_days_ago: 5,
      validity_days: 15
    }
  },
  {
    mosque_name_bn: 'বায়তুল মোকাররম জামে মসজিদ (সদর রোড, বরিশাল)',
    mosque_name_en: 'Baitul Mukarram Jame Masjid (Sadar Road, Barisal)',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    address: 'সদর রোড, কোতোয়ালি, বরিশাল-৮২০০ (Sadar Rd, Barisal Sadar)',
    division: 'Barisal',
    district: 'Barisal',
    upazila: 'Barisal Sadar',
    union_name: 'Sadar Road',
    latitude: 22.70100,
    longitude: 90.35350,
    contact: '+880 1819-112233',
    prayer: {
      fajr: '05:08 AM',
      dhuhr: '01:15 PM',
      asr: '04:26 PM',
      maghrib: '06:06 PM',
      isha: '08:00 PM',
      jummah: '01:30 PM',
      chart_image: '/images/charts/baitul_mukarram_chart.svg',
      updated_days_ago: 6,
      validity_days: 15
    }
  },
  {
    mosque_name_bn: 'কসবা ঐতিহাসিক শাহী জামে মসজিদ (গৌরনদী)',
    mosque_name_en: 'Kasba Shahi Jame Masjid (Gournadi, Barisal)',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    address: 'ঢাকা-বরিশাল মহাসড়ক, কসবা, গৌরনদী, বরিশাল-৮২১১',
    division: 'Barisal',
    district: 'Barisal',
    upazila: 'Gournadi',
    union_name: 'Kasba',
    latitude: 22.97390,
    longitude: 90.22890,
    contact: '+880 1913-667788',
    prayer: {
      fajr: '05:06 AM',
      dhuhr: '01:15 PM',
      asr: '04:25 PM',
      maghrib: '06:05 PM',
      isha: '08:00 PM',
      jummah: '01:30 PM',
      chart_image: '/images/charts/anderkilla_chart.svg',
      updated_days_ago: 17, // expired -> triggers update warning
      validity_days: 15
    }
  }
];

async function seedBarisal() {
  console.log('Connecting to PostgreSQL database to seed Barisal mosques...');
  const client = await pool.connect();

  try {
    for (const m of BARISAL_MOSQUES) {
      // Check if already seeded
      const checkRes = await client.query('SELECT id FROM mosques WHERE mosque_name_en = $1;', [m.mosque_name_en]);
      if (checkRes.rows.length > 0) {
        console.log(`Mosque already exists: ${m.mosque_name_en}`);
        continue;
      }

      const now = new Date();
      const updatedDate = new Date(now.getTime() - m.prayer.updated_days_ago * 24 * 60 * 60 * 1000);
      const nextUpdateDate = new Date(updatedDate.getTime() + m.prayer.validity_days * 24 * 60 * 60 * 1000);

      const insertMosqueSql = `
        INSERT INTO mosques (
          mosque_name_bn, mosque_name_en, image, address,
          division, district, upazila, union_name,
          latitude, longitude, contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
      `;
      const mRes = await client.query(insertMosqueSql, [
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
        m.contact
      ]);
      const mosqueId = mRes.rows[0].id;

      const insertPrayerSql = `
        INSERT INTO prayer_times (
          mosque_id, fajr, dhuhr, asr, maghrib, isha, jummah,
          image, updated_date, next_update_date, is_verified, ocr_raw_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `;
      await client.query(insertPrayerSql, [
        mosqueId,
        m.prayer.fajr,
        m.prayer.dhuhr,
        m.prayer.asr,
        m.prayer.maghrib,
        m.prayer.isha,
        m.prayer.jummah,
        m.prayer.chart_image,
        updatedDate,
        nextUpdateDate,
        true,
        `ফজর ${m.prayer.fajr} যোহর ${m.prayer.dhuhr} আসর ${m.prayer.asr} মাগরিব ${m.prayer.maghrib} এশা ${m.prayer.isha}`
      ]);

      console.log(`Seeded: ${m.mosque_name_bn} (${m.mosque_name_en})`);
    }

    const totalRes = await client.query('SELECT COUNT(*) FROM mosques;');
    console.log(`Total mosques in database now: ${totalRes.rows[0].count}`);
  } catch (err) {
    console.error('Error seeding Barisal mosques:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedBarisal().catch(() => process.exit(1));
