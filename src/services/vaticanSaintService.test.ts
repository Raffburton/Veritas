import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchVaticanSaint, getVaticanSaintUrls } from './vaticanSaintService.ts';

test('getVaticanSaintUrls creates the official Vatican News URLs for the day', () => {
  assert.deepEqual(getVaticanSaintUrls('2026-09-01'), {
    dataUrl: 'https://www.vaticannews.va/pt/santo-do-dia/09/01.saints.js',
    sourceUrl: 'https://www.vaticannews.va/pt/santo-do-dia/09/01.html',
  });
});

test('fetchVaticanSaint prioritizes the featured saint', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    saints: [
      { name: 'Outro santo', isFavorite: 'false' },
      { name: 'S. Egídio, abade', isFavorite: 'true' },
    ],
  }));

  try {
    assert.deepEqual(await fetchVaticanSaint('2026-09-01'), {
      name: 'S. Egídio, abade',
      sourceUrl: 'https://www.vaticannews.va/pt/santo-do-dia/09/01.html',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
