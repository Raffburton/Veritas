import assert from 'node:assert/strict';
import test from 'node:test';

import { compareVersions, normalizeVersion } from './versionCheck.ts';

test('normalizeVersion removes the leading v prefix and keeps numeric parts', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
  assert.equal(normalizeVersion('1.2.3-beta.1'), '1.2.3-beta.1');
});

test('compareVersions returns true only when the latest release is newer than current', () => {
  assert.equal(compareVersions('1.0.0', '1.1.0'), true);
  assert.equal(compareVersions('1.1.0', 'v1.1.0'), false);
  assert.equal(compareVersions('1.2.3', '1.2.2'), false);
  assert.equal(compareVersions('1.2.3', '1.2.3-beta.1'), false);
});
