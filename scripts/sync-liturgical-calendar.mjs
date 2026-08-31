import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const year = Number(process.argv[2] ?? new Date().getFullYear());
const endpoint = 'https://liturgia.up.railway.app/v2/';
const output = resolve(`src/data/LiturgicalCalendar${year}.json`);
const dates = [];

for (let month = 0; month < 12; month += 1) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day += 1) dates.push({ day, month: month + 1 });
}

function readings(items) {
  if (!Array.isArray(items)) return [];
  return items.map(({ referencia, titulo, refrao }) => ({
    reference: referencia ?? '',
    ...(titulo ? { title: titulo } : {}),
    ...(refrao ? { response: refrao } : {}),
  }));
}

async function fetchDay({ day, month }, attempt = 1) {
  try {
    const response = await fetch(`${endpoint}?dia=${day}&mes=${month}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const expected = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    if (payload.data !== expected) throw new Error(`Data recebida ${payload.data}; esperada ${expected}`);
    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      celebration: payload.liturgia,
      color: payload.cor,
      readings: {
        firstReading: readings(payload.leituras?.primeiraLeitura),
        psalm: readings(payload.leituras?.salmo),
        secondReading: readings(payload.leituras?.segundaLeitura),
        gospel: readings(payload.leituras?.evangelho),
        extras: readings(payload.leituras?.extras),
      },
    };
  } catch (error) {
    if (attempt < 4) return fetchDay({ day, month }, attempt + 1);
    throw new Error(`Falha em ${day}/${month}/${year}: ${error.message}`);
  }
}

const days = [];
for (let index = 0; index < dates.length; index += 8) {
  const batch = await Promise.all(dates.slice(index, index + 8).map((date) => fetchDay(date)));
  days.push(...batch);
  process.stdout.write(`\rSincronizando ${days.length}/${dates.length} dias`);
}

const calendar = {
  metadata: {
    year,
    locale: 'pt-BR',
    region: 'Brasil',
    generatedAt: new Date().toISOString(),
    source: endpoint,
    notice: 'Calendário e referências importados de fonte comunitária; confira celebrações locais com sua diocese.',
  },
  days,
};

await writeFile(output, `${JSON.stringify(calendar, null, 2)}\n`, 'utf8');
process.stdout.write(`\nCalendário salvo em ${output}\n`);
