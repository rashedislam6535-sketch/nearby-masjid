/**
 * Safe mosque image resolver and responsive sizing utility.
 * Guarantees that no <img> ever renders with empty src, whitespace, or invalid paths.
 */

export const DEFAULT_MOSQUE_PLACEHOLDER = '/images/mosque-placeholder.svg';

/**
 * Returns a validated image URL, defaulting to local optimized vector placeholder
 * if the provided source is null, undefined, empty, or whitespace.
 */
export function getSafeMosqueImage(imageUrl?: string | null): string {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return DEFAULT_MOSQUE_PLACEHOLDER;
  }
  const trimmed = imageUrl.trim();
  if (trimmed === '' || trimmed === '""' || trimmed === "''") {
    return DEFAULT_MOSQUE_PLACEHOLDER;
  }
  return trimmed;
}

/**
 * Transforms high-resolution remote image URLs (like Unsplash 1200px) into
 * smaller responsive widths (e.g. 400px or 600px) for mobile/grid performance.
 */
export function getResponsiveImageUrl(imageUrl: string, width = 600, quality = 80): string {
  const safe = getSafeMosqueImage(imageUrl);
  if (safe.includes('images.unsplash.com')) {
    try {
      const url = new URL(safe);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch {
      return safe;
    }
  }
  return safe;
}
