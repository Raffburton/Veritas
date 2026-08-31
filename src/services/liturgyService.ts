import liturgyJson from '../data/LiturgyData.json';
import type { DailyLiturgy, LiturgyData } from '../types/liturgy';

const liturgyData = liturgyJson as LiturgyData;

function normalizeDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLiturgyWeek(): readonly DailyLiturgy[] {
  return liturgyData.days;
}

export function getLiturgyByDate(date: Date | string): DailyLiturgy | null {
  const normalizedDate = normalizeDate(date);

  return liturgyData.days.find((day) => day.date === normalizedDate) ?? null;
}

export function getLiturgyByWeekday(weekday: string): DailyLiturgy | null {
  const normalizedWeekday = weekday.trim().toLocaleLowerCase('pt-BR');

  return (
    liturgyData.days.find(
      (day) => day.weekday.toLocaleLowerCase('pt-BR') === normalizedWeekday,
    ) ?? null
  );
}

export function getLiturgyMetadata(): Readonly<LiturgyData['metadata']> {
  return liturgyData.metadata;
}
