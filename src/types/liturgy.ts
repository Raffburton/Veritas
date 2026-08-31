export type LiturgicalColor = 'verde' | 'branco' | 'vermelho' | 'roxo' | 'rosa';

export type Reading = {
  reference: string;
  title: string;
  summary: string;
};

export type Psalm = {
  reference: string;
  response: string;
};

export type SaintOfTheDay = {
  name: string;
  description: string;
};

export type DailyLiturgy = {
  date: string;
  weekday: string;
  liturgicalSeason: string;
  liturgicalColor: LiturgicalColor;
  firstReading: Reading;
  psalm: Psalm;
  gospel: Reading;
  saintOfTheDay: SaintOfTheDay;
};

export type LiturgyData = {
  metadata: {
    isExample: boolean;
    weekStart: string;
    weekEnd: string;
    language: string;
  };
  days: DailyLiturgy[];
};
