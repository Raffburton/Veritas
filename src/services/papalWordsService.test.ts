import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractPapalWordsHtml,
  fetchPapalWords,
  getPapalWordsSourceUrl,
  isPapalWordsCacheFresh,
  PAPAL_WORDS_CACHE_TTL_MS,
  papalWordsHtmlToText,
} from './papalWordsService.ts';

test('papalWordsHtmlToText removes markup and preserves paragraph breaks', () => {
  assert.equal(
    papalWordsHtmlToText('<p>Jesus n&atilde;o abandona.<br>Ele caminha conosco.</p><p><i>Papa Francisco</i></p>'),
    'Jesus não abandona.\nEle caminha conosco.\n\nPapa Francisco',
  );
});

test('papalWordsHtmlToText decodes numeric entities', () => {
  assert.equal(papalWordsHtmlToText('<p>Gra&#231;a e paz &#x2014; sempre.</p>'), 'Graça e paz — sempre.');
});

test('getPapalWordsSourceUrl creates the official page URL for the selected date', () => {
  assert.equal(
    getPapalWordsSourceUrl('2026-09-01'),
    'https://www.vaticannews.va/pt/palavra-do-dia/2026/09/01.html',
  );
});

test('extractPapalWordsHtml accepts a renamed papal field and rejects readings', () => {
  assert.equal(extractPapalWordsHtml({
    speech: [{
      letturaText: '<p>Papa aparece por acaso nesta leitura, que não pode ser usada.</p>',
      vangeloText: '<p>Evangelho do dia</p>',
      popeCommentary: '<p>Uma reflexão localizada pelo campo alternativo.</p>',
    }],
  }), '<p>Uma reflexão localizada pelo campo alternativo.</p>');
});

test('extractPapalWordsHtml can locate attributed commentary under an unknown field', () => {
  const commentary = '<p>Uma reflexão suficientemente longa para ser identificada de forma segura sem depender do nome original do campo. Papa Francisco, Angelus.</p>';
  assert.equal(extractPapalWordsHtml({ speech: [{ contentV2: commentary }] }), commentary);
});

test('isPapalWordsCacheFresh expires entries after six hours', () => {
  const now = Date.parse('2026-09-01T18:00:00.000Z');
  const entry = {
    date: '2026-09-01',
    text: 'Reflexão',
    sourceUrl: 'https://www.vaticannews.va/pt/palavra-do-dia/2026/09/01.html',
    fetchedAt: new Date(now - PAPAL_WORDS_CACHE_TTL_MS + 1).toISOString(),
  };

  assert.equal(isPapalWordsCacheFresh(entry, now), true);
  assert.equal(isPapalWordsCacheFresh({
    ...entry,
    fetchedAt: new Date(now - PAPAL_WORDS_CACHE_TTL_MS).toISOString(),
  }, now), false);
  assert.equal(isPapalWordsCacheFresh({ ...entry, fetchedAt: '' }, now), false);
});

test('fetchPapalWords keeps only the papal commentary from the Vatican payload', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    speech: [{
      letturaText: '<p>Primeira leitura que não deve ser importada</p>',
      vangeloText: '<p>Evangelho que não deve ser importado</p>',
      hfwText: '<p>A reflex&atilde;o papal.</p>',
    }],
  }));

  try {
    const result = await fetchPapalWords('2026-09-01');
    assert.ok(result);
    if (!result) throw new Error('Resultado papal esperado.');
    assert.deepEqual({ ...result, fetchedAt: '<dynamic>' }, {
      date: '2026-09-01',
      text: 'A reflexão papal.',
      sourceUrl: 'https://www.vaticannews.va/pt/palavra-do-dia/2026/09/01.html',
      fetchedAt: '<dynamic>',
    });
    assert.equal(Number.isNaN(Date.parse(result.fetchedAt)), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
