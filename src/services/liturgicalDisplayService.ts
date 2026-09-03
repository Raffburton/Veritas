import type { LiturgicalCalendarDay } from './liturgicalCalendarService';

const ORDINARY_WEEK_PATTERN = /(?:da|do)\s+(\d+[ªº])\s+Semana\s+do\s+(.+)$/i;

const LITURGICAL_WEEKDAYS = [
  'Domingo',
  '2ª feira',
  '3ª feira',
  '4ª feira',
  '5ª feira',
  '6ª feira',
  'Sábado',
];

function localDateFromIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Keeps saints and memorials from replacing the weekday heading in the reader.
 * The API's `liturgia` field describes the celebration, so on memorials we use
 * another day in the same week to recover the ordinary-time week and season.
 */
export function getLiturgicalDayDisplayTitle(
  selectedDay: LiturgicalCalendarDay,
  week: LiturgicalCalendarDay[],
): string {
  if (ORDINARY_WEEK_PATTERN.test(selectedDay.celebration)) {
    return selectedDay.celebration;
  }

  const ordinaryDay = week.find((day) => ORDINARY_WEEK_PATTERN.test(day.celebration));
  const ordinaryWeek = ordinaryDay?.celebration.match(ORDINARY_WEEK_PATTERN);
  if (!ordinaryWeek) return selectedDay.celebration;

  const [, weekNumber, season] = ordinaryWeek;
  const weekday = localDateFromIso(selectedDay.date).getDay();
  return `${LITURGICAL_WEEKDAYS[weekday]} da ${weekNumber} Semana do ${season}`;
}
