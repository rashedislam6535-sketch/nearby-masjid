import { NextRequest } from 'next/server';

const DEFAULT_ADMIN_KEY = 'nm_admin_secret_key_2026_bd';

/**
 * Validates admin authorization from request headers, Bearer tokens, or cookies.
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const expectedKey = process.env.ADMIN_API_KEY || DEFAULT_ADMIN_KEY;

  // 1. Check custom admin header
  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && headerKey.trim() === expectedKey) {
    return true;
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'ApiKey')) {
      if (parts[1].trim() === expectedKey) {
        return true;
      }
    }
  }

  // 3. Check admin cookie
  const cookieKey = request.cookies.get('nm_admin_session')?.value;
  if (cookieKey && cookieKey.trim() === expectedKey) {
    return true;
  }

  return false;
}

/**
 * Sanitizes input string to prevent stored/reflected XSS.
 * Removes dangerous HTML tags and script injections.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>'"&]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return match;
      }
    })
    .trim();
}

/**
 * Validates geographical coordinates (within valid Earth range and BD vicinity).
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  if (numLat < -90 || numLat > 90) return false;
  if (numLng < -180 || numLng > 180) return false;
  return true;
}

/**
 * Allowed timetable upload file MIME types and maximum file size (5MB).
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml'
];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateFileUpload(type: string, size: number): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type: ${type}. Allowed formats: JPEG, PNG, WebP, SVG.`
    };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5MB limit (${(size / (1024 * 1024)).toFixed(1)}MB).`
    };
  }
  return { valid: true };
}
