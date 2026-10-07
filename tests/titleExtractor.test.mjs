import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDocumentTitle, cleanMarkdownFormatting } from '../src/utils/titleExtractor.ts';

test('titleExtractor - extracts title from YAML frontmatter', () => {
  const md = `---
title: "Custom Architecture Spec"
author: "Engineering"
---

# Ignored Heading
Body text here.`;

  const title = extractDocumentTitle(md);
  assert.equal(title, 'Custom Architecture Spec');
});

test('titleExtractor - extracts title from ATX # Heading', () => {
  const md = `
# Executive Summary & Q3 Roadmap

Some introductory text.`;

  const title = extractDocumentTitle(md);
  assert.equal(title, 'Executive Summary & Q3 Roadmap');
});

test('titleExtractor - extracts title from Setext === Heading', () => {
  const md = `Quarterly Performance Review
============================

Detailed performance stats...`;

  const title = extractDocumentTitle(md);
  assert.equal(title, 'Quarterly Performance Review');
});

test('titleExtractor - falls back to ## Heading 2 if no H1 exists', () => {
  const md = `## Deep Dive into Distributed Systems

Content goes here.`;

  const title = extractDocumentTitle(md);
  assert.equal(title, 'Deep Dive into Distributed Systems');
});

test('titleExtractor - cleans markdown markup from title', () => {
  const raw = '# Welcome to [MD Viewer](https://example.com) with **Bold** and `code`';
  const title = extractDocumentTitle(raw);
  assert.equal(title, 'Welcome to MD Viewer with Bold and code');
});

test('titleExtractor - falls back to filename when content is empty', () => {
  const title = extractDocumentTitle('', 'Project_Specs.md');
  assert.equal(title, 'Project_Specs.md');
});

test('titleExtractor - returns Untitled Document when content and filename are empty', () => {
  const title = extractDocumentTitle('   \n\n');
  assert.equal(title, 'Untitled Document');
});

test('cleanMarkdownFormatting - removes KaTeX and strikethroughs', () => {
  const text = 'Formula $E = mc^2$ and ~~deprecated~~ item';
  const clean = cleanMarkdownFormatting(text);
  assert.equal(clean, 'Formula  and deprecated item');
});
