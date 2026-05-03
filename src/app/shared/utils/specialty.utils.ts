export const SPECIALTY_COLORS: Record<string, { bg: string; text: string }> = {
  'Técnico de Mantenimiento': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Técnico General': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Técnico de Reparaciones': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Supervisor Técnico': { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700' };

export function getSpecialtyColor(specialty: string): string {
  const color = SPECIALTY_COLORS[specialty] ?? DEFAULT_COLOR;
  return `${color.bg} ${color.text}`;
}

export const SPECIALTY_ICONS: Record<string, string> = {
  'Supervisor Técnico': 'user-cog',
  'Técnico de Mantenimiento': 'settings-2',
  'Técnico de Reparaciones': 'wrench',
  'Técnico General': 'badge',
};

const DEFAULT_ICON = 'user';

export function getSpecialtyIcon(specialty: string): string {
  return SPECIALTY_ICONS[specialty] ?? DEFAULT_ICON;
}