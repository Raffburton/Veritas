export type PapalWords = {
  date: string;
  text: string;
  sourceUrl: string;
};

type VaticanSpeechPayload = {
  speech?: Array<{
    hfwText?: string;
  }>;
};

const VATICAN_NEWS_BASE_URL = 'https://www.vaticannews.va/pt/palavra-do-dia';

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
  const html = payload.speech?.[0]?.hfwText?.trim();
  if (!html) return null;

  const text = papalWordsHtmlToText(html);
  return text ? { date, text, sourceUrl } : null;
}
