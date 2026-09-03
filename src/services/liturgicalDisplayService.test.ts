import assert from 'node:assert/strict';
import test from 'node:test';

import type { LiturgicalCalendarDay } from './liturgicalCalendarService.ts';
import { getLiturgicalDayDisplayTitle } from './liturgicalDisplayService.ts';

function day(date: string, celebration: string): LiturgicalCalendarDay {
  return {
    date,
    celebration,
    color: 'Verde',
    readings: {
      firstReading: [],
      psalm: [],
      secondReading: [],
      gospel: [],
      extras: [],
    },
  };
}

test('keeps an ordinary weekday title unchanged', () => {
  const friday = day('2026-09-04', '6ª feira da 22ª Semana do Tempo Comum');
  assert.equal(getLiturgicalDayDisplayTitle(friday, [friday]), friday.celebration);
});

test('shows the liturgical weekday instead of a saint memorial', () => {
  const wednesday = day('2026-09-02', '4ª feira da 22ª Semana do Tempo Comum');
  const thursday = day('2026-09-03', 'São Gregório Magno, papa e doutor da Igreja, Memória');
  const friday = day('2026-09-04', '6ª feira da 22ª Semana do Tempo Comum');

  assert.equal(
    getLiturgicalDayDisplayTitle(thursday, [wednesday, thursday, friday]),
    '5ª feira da 22ª Semana do Tempo Comum',
  );
});

test('falls back to the API celebration outside ordinary weeks', () => {
  const christmas = day('2026-12-25', 'Natal de Nosso Senhor Jesus Cristo, Solenidade');
  assert.equal(getLiturgicalDayDisplayTitle(christmas, [christmas]), christmas.celebration);
});
