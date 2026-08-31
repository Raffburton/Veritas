import calendarJson from '../data/LiturgicalCalendar2026.json';

export type CalendarReading = {
  reference: string;
  title?: string;
  response?: string;
};

export type LiturgicalCalendarDay = {
  date: string;
  celebration: string;
  color: string;
  readings: {
    firstReading: CalendarReading[];
    psalm: CalendarReading[];
    secondReading: CalendarReading[];
    gospel: CalendarReading[];
    extras: CalendarReading[];
  };
};

type LiturgicalCalendar = {
  metadata: {
    year: number;
    locale: string;
    region: string;
    generatedAt: string;
    source: string;
    notice: string;
  };
  days: LiturgicalCalendarDay[];
};

const calendar = calendarJson as LiturgicalCalendar;
const daysByDate = new Map(calendar.days.map((day) => [day.date, day]));

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLiturgicalDay(date: Date | string): LiturgicalCalendarDay | null {
  const isoDate = typeof date === 'string' ? date : toLocalIsoDate(date);
  return daysByDate.get(isoDate) ?? null;
}

export function getLiturgicalWeek(anchor = new Date()): LiturgicalCalendarDay[] {
  const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  sunday.setDate(sunday.getDate() - sunday.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return getLiturgicalDay(date);
  }).filter((day): day is LiturgicalCalendarDay => day !== null);
}

export function getLiturgicalCalendarMetadata() {
  return calendar.metadata;
}
