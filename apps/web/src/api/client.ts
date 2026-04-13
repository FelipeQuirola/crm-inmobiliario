import axios from 'axios';

export const API_URL  = import.meta.env.VITE_API_URL  as string;
export const SLUG     = import.meta.env.VITE_TENANT_SLUG as string;
export const CRM_URL  = import.meta.env.VITE_CRM_URL  as string;
export const WA_NUM   = import.meta.env.VITE_WHATSAPP_NUMBER as string;

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams({ slug: SLUG });
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  return q.toString();
}
