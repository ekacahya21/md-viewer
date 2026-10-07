import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.ts';

test('i18n - English and Indonesian have complete translation keys for new features', () => {
  // Check header.downloadDirect
  assert.ok(translations.en.header.downloadDirect, 'en header.downloadDirect should exist');
  assert.ok(translations.id.header.downloadDirect, 'id header.downloadDirect should exist');
  assert.equal(translations.en.header.downloadDirect, 'Download (.md)');
  assert.equal(translations.id.header.downloadDirect, 'Download (.md)');

  // Check dragOverlay readOnly fields
  assert.ok(translations.en.dragOverlay.readOnlyTitle, 'en dragOverlay.readOnlyTitle should exist');
  assert.ok(translations.en.dragOverlay.readOnlySubtitle, 'en dragOverlay.readOnlySubtitle should exist');
  assert.ok(translations.id.dragOverlay.readOnlyTitle, 'id dragOverlay.readOnlyTitle should exist');
  assert.ok(translations.id.dragOverlay.readOnlySubtitle, 'id dragOverlay.readOnlySubtitle should exist');

  // Check confirmReplaceModal keys
  const requiredKeys = ['title', 'description', 'currentDoc', 'newFile', 'warning', 'cancel', 'confirm'];
  for (const key of requiredKeys) {
    assert.ok(translations.en.confirmReplaceModal[key], `en confirmReplaceModal.${key} should exist`);
    assert.ok(translations.id.confirmReplaceModal[key], `id confirmReplaceModal.${key} should exist`);
  }
});

test('useDocumentSummary - content signature generation helper', async () => {
  const { getContentSignature } = await import('../src/hooks/useDocumentSummary.ts');
  const sample = '# Hello World\nThis is sample text for testing summary signatures.';
  const sig = getContentSignature(sample);
  assert.ok(sig.startsWith(`${sample.length}_`));
});

