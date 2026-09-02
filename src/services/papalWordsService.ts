export type PapalWords = {
  date: string;
  text: string;
  sourceUrl: string;
  fetchedAt: string;
};

type VaticanSpeechPayload = {
  speech?: Array<Record<string, unknown> & { hfwText?: string }>;
};

const VATICAN_NEWS_BASE_URL = 'https://www.vaticannews.va/pt/palavra-do-dia';
export const PAPAL_WORDS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const EXCLUDED_CONTENT_FIELD = /(?:audio|evangel|lettura|reading|salmo|vangelo)/i;
const PAPAL_CONTENT_FIELD = /(?:comment|hfw|holy.?father|homil|meditat|papa|pope|pontif|reflection|rifless)/i;
const PAPAL_ATTRIBUTION = /\b(?:angelus|audi[eê]ncia|homilia|papa|santo padre)\b/i;

const HTML_ENTITIES: Record<string, string> = {
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  bdquo: '„', hellip: '…', laquo: '«', ldquo: '“', lsquo: '‘',
  mdash: '—', ndash: '–', raquo: '»', rdquo: '”', rsquo: '’',
  Aacute: 'Á', Acirc: 'Â', Agrave: 'À', Atilde: 'Ã', Auml: 'Ä',
  Ccedil: 'Ç', Eacute: 'É', Ecirc: 'Ê', Egrave: 'È', Euml: 'Ë',
  Iacute: 'Í', Icirc: 'Î', Igrave: 'Ì', Iuml: 'Ï',
  Oacute: 'Ó', Ocirc: 'Ô', Ograve: 'Ò', Otilde: 'Õ', Ouml: 'Ö',
  Uacute: 'Ú', Ucirc: 'Û', Ugrave: 'Ù', Uuml: 'Ü',
  aacute: 'á', acirc: 'â', agrave: 'à', atilde: 'ã', auml: 'ä',
  ccedil: 'ç', eacute: 'é', ecirc: 'ê', egrave: 'è', euml: 'ë',
  iacute: 'í', icirc: 'î', igrave: 'ì', iuml: 'ï',
  oacute: 'ó', ocirc: 'ô', ograve: 'ò', otilde: 'õ', ouml: 'ö',
  uacute: 'ú', ucirc: 'û', ugrave: 'ù', uuml: 'ü',
  ordm: 'º', ordmasc: 'º', ordF: 'ª', ordFeminine: 'ª',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return HTML_ENTITIES[code] ?? entity;
  });
}

export function papalWordsHtmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:blockquote|div|h[1-6]|li|p)\s*>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractPapalWordsHtml(payload: VaticanSpeechPayload): string | null {
  const speeches = Array.isArray(payload.speech) ? payload.speech : [];

  for (const speech of speeches) {
    const primary = typeof speech.hfwText === 'string' ? speech.hfwText.trim() : '';
    if (primary) return primary;
  }

  for (const speech of speeches) {
    const candidates = Object.entries(speech).filter(
      ([key, value]) => typeof value === 'string' && !EXCLUDED_CONTENT_FIELD.test(key),
    ) as Array<[string, string]>;

    const namedCandidate = candidates.find(
      ([key, value]) => PAPAL_CONTENT_FIELD.test(key) && value.trim(),
    );
    if (namedCandidate) return namedCandidate[1].trim();

    const attributedCandidate = candidates.find(([, value]) => {
      const text = papalWordsHtmlToText(value);
      return text.length >= 80 && PAPAL_ATTRIBUTION.test(text);
    });
    if (attributedCandidate) return attributedCandidate[1].trim();
  }

  return null;
}

export function isPapalWordsCacheFresh(
  papalWords: PapalWords | undefined,
  now = Date.now(),
): boolean {
  if (!papalWords?.fetchedAt) return false;
  const fetchedAt = Date.parse(papalWords.fetchedAt);
  return Number.isFinite(fetchedAt) && now - fetchedAt < PAPAL_WORDS_CACHE_TTL_MS;
}

export function getPapalWordsSourceUrl(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Data inválida para Palavras do Papa.');
  }
  const [year, month, day] = date.split('-');
  return `${VATICAN_NEWS_BASE_URL}/${year}/${month}/${day}.html`;
}

export async function fetchPapalWords(date: string, signal?: AbortSignal): Promise<PapalWords | null> {
  const sourceUrl = getPapalWordsSourceUrl(date);
  const response = await fetch(sourceUrl.replace(/\.html$/, '.speech.js'), { signal });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Vatican News respondeu com status ${response.status}.`);

  const payload = (await response.json()) as VaticanSpeechPayload;
  const html = extractPapalWordsHtml(payload);
  if (!html) return null;

  const text = papalWordsHtmlToText(html);
  return text ? { date, text, sourceUrl, fetchedAt: new Date().toISOString() } : null;
}
