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
