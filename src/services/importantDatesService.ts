export type ImportantCatholicDate = {
  id: string;
  title: string;
  date: Date;
  description: string;
  movable: boolean;
};

function gregorianEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sundayOnOrAfter(date: Date) {
  return addDays(date, (7 - date.getDay()) % 7);
}

export function getImportantCatholicDates(year = new Date().getFullYear()): ImportantCatholicDate[] {
  const easter = gregorianEaster(year);
  return [
    { id: 'epiphany', title: 'Epifania do Senhor', date: sundayOnOrAfter(new Date(year, 0, 2)), description: 'Manifestação de Jesus Cristo às nações.', movable: true },
    { id: 'annunciation', title: 'Anunciação do Senhor', date: new Date(year, 2, 25), description: 'O anúncio do anjo Gabriel e a encarnação do Filho de Deus.', movable: false },
    { id: 'palm-sunday', title: 'Domingo de Ramos', date: addDays(easter, -7), description: 'Entrada de Jesus em Jerusalém e início da Semana Santa.', movable: true },
    { id: 'holy-thursday', title: 'Quinta-feira Santa', date: addDays(easter, -3), description: 'Memória da Última Ceia e instituição da Eucaristia.', movable: true },
    { id: 'good-friday', title: 'Paixão e Crucificação do Senhor', date: addDays(easter, -2), description: 'Sexta-feira Santa: paixão e morte de Jesus na cruz.', movable: true },
    { id: 'easter', title: 'Páscoa da Ressurreição', date: easter, description: 'Celebração da ressurreição de Jesus Cristo.', movable: true },
    { id: 'ascension', title: 'Ascensão do Senhor', date: addDays(easter, 42), description: 'Jesus é elevado ao céu diante dos discípulos.', movable: true },
    { id: 'pentecost', title: 'Pentecostes', date: addDays(easter, 49), description: 'Vinda do Espírito Santo sobre a Igreja.', movable: true },
    { id: 'corpus-christi', title: 'Corpus Christi', date: addDays(easter, 60), description: 'Solenidade do Santíssimo Corpo e Sangue de Cristo.', movable: true },
    { id: 'assumption', title: 'Assunção de Nossa Senhora', date: sundayOnOrAfter(new Date(year, 7, 15)), description: 'Celebração da assunção de Maria ao céu.', movable: true },
    { id: 'all-saints', title: 'Todos os Santos', date: sundayOnOrAfter(new Date(year, 10, 1)), description: 'Memória de todos os santos e santas de Deus.', movable: true },
    { id: 'immaculate-conception', title: 'Imaculada Conceição', date: new Date(year, 11, 8), description: 'Solenidade da Imaculada Conceição de Maria.', movable: false },
    { id: 'christmas', title: 'Natal do Senhor', date: new Date(year, 11, 25), description: 'Celebração do nascimento de Jesus Cristo.', movable: false },
  ].sort((first, second) => first.date.getTime() - second.date.getTime());
}
