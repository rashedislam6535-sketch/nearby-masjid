import { MetadataRoute } from 'next';
import { query } from '@/lib/dbClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nearby-masjid.vercel.app';
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    }
  ];

  try {
    const rows = await query<{ id: number; updated_at?: string; created_at?: string }>(
      'SELECT id, created_at FROM mosques ORDER BY id ASC LIMIT 100;'
    );
    rows.forEach((r) => {
      routes.push({
        url: `${baseUrl}/?mosque=${r.id}`,
        lastModified: r.created_at ? new Date(r.created_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  } catch (err) {
    console.warn('Sitemap DB query error:', err);
  }

  return routes;
}
