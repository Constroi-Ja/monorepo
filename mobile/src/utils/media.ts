import { API_URL } from '@/api/client';

// Resolve URLs de mídia do Django (logo, foto, etc.) para funcionar no device.
// Django pode retornar: "/media/..." (relativo) ou "http://localhost:8000/media/..." (localhost).
export function resolveMediaUrl(url: string | null | undefined): { uri: string } | undefined {
  if (!url) return undefined;

  let resolved = url;

  if (url.startsWith('/')) {
    resolved = `${API_URL}${url}`;
  } else if (/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    resolved = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_URL);
  }

  return { uri: resolved };
}
