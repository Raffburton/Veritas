export type VaticanSaint = {
  name: string;
  sourceUrl: string;
};

type VaticanSaintPayload = {
  saints?: Array<{
    name?: string;
    isFavorite?: string | boolean;
  }>;
};

const VATICAN_SAINT_BASE_URL = 'https://www.vaticannews.va/pt/santo-do-dia';

export function getVaticanSaintUrls(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Data inválida para o Santo do Dia.');
  }

  const [, month, day] = date.split('-');
  return {
    dataUrl: `${VATICAN_SAINT_BASE_URL}/${month}/${day}.saints.js`,
    sourceUrl: `${VATICAN_SAINT_BASE_URL}/${month}/${day}.html`,
  };
}

export async function fetchVaticanSaint(date: string, signal?: AbortSignal): Promise<VaticanSaint | null> {
  const { dataUrl, sourceUrl } = getVaticanSaintUrls(date);
  const response = await fetch(dataUrl, { signal });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Vatican News respondeu com status ${response.status}.`);

  const payload = (await response.json()) as VaticanSaintPayload;
  const saints = Array.isArray(payload.saints) ? payload.saints : [];
  const featuredSaint = saints.find((saint) => saint.isFavorite === true || saint.isFavorite === 'true');
  const name = featuredSaint?.name?.trim() || saints.find((saint) => saint.name?.trim())?.name?.trim();

  return name ? { name, sourceUrl } : null;
}
