import { createHash } from 'crypto';

/**
 * Elimina todo excepto dígitos del teléfono.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * sha256(phoneNormalized + email.toLowerCase())
 * Si no hay email, se usa solo el teléfono normalizado.
 * Sirve para detectar duplicados rápidamente con un índice.
 */
export function computeDuplicateHash(
  phoneNormalized: string,
  email?: string | null,
): string {
  const input = phoneNormalized + (email ? email.toLowerCase() : '');
  return createHash('sha256').update(input).digest('hex');
}
