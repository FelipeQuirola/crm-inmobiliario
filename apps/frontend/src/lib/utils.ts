import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a relative upload path to a full URL */
export function buildImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const base = import.meta.env.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
      : 'http://localhost:3000';
    return `${base}${url}`;
  }
  return url;
}

/** Formatea un número como USD: $85,000 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
