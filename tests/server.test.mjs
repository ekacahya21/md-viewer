import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const TEST_PORT = 3998;
const TEST_DB = path.join('/tmp', `test_shared_${Date.now()}.db`);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess;

test.before(async () => {
  // Ensure clean test db
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  serverProcess = spawn('node', ['server.mjs'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DB_PATH: TEST_DB,
      NODE_ENV: 'test',
    },
    stdio: 'pipe',
  });

  // Wait for server to be responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.equal(ready, true, 'Server failed to start in time');
});

test.after(() => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  try {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  } catch {}
});

test('Healthcheck - GET /api/health returns 200 with status ok and version', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.version, '1.0.0');
  assert.equal(json.database, 'connected');
  assert.equal(typeof json.uptime, 'number');
});

test('Security Headers - responses include required hardening headers', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.ok(res.headers.get('content-security-policy'));
});

test('Share API - rejects empty content with 400', async () => {
  const res = await fetch(`${BASE_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', content: '' }),
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.ok(json.error);
});

test('Share API - rejects oversized content (>1MB) with 413', async () => {
  const hugeContent = 'a'.repeat(1000001);
  const res = await fetch(`${BASE_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Huge', content: hugeContent }),
  });
  assert.equal(res.status, 413);
});

test('Share API - successfully creates and retrieves shared document', async () => {
  const payload = {
    title: 'Automated CI Test Document',
    content: '# Hello World\nThis is a test markdown document.',
  };

  const createRes = await fetch(`${BASE_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(createRes.status, 201);
  const createJson = await createRes.json();
  assert.ok(createJson.id);
  assert.ok(createJson.shortUrl);
  assert.ok(createJson.editToken);

  // Retrieve document
  const getRes = await fetch(`${BASE_URL}/api/share/${createJson.id}`);
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.equal(getJson.title, payload.title);
  assert.equal(getJson.content, payload.content);
});
