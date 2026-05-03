const TZ = 'America/Lima';

export function limaDateStr(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

export function limaTimeStr(d: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  const parts = String(dateString).split('T')[0].split('-');
  if (parts.length < 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateLong(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
  const prefix = cleanPhone.startsWith('51') ? '' : '51';
  return `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(message)}`;
}
