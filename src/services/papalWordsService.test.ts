import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchPapalWords, getPapalWordsSourceUrl, papalWordsHtmlToText } from './papalWordsService.ts';

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
    assert.deepEqual(await fetchPapalWords('2026-09-01'), {
      date: '2026-09-01',
      text: 'A reflexão papal.',
      sourceUrl: 'https://www.vaticannews.va/pt/palavra-do-dia/2026/09/01.html',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
