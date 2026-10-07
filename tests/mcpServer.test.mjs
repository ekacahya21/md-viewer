import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import fs from 'node:fs';

const TEST_PORT = 3999;
const TEST_DB = path.join('/tmp', `test_mcp_${Date.now()}.db`);
const TEST_TOKENS = path.join('/tmp', `test_mcp_tokens_${Date.now()}.json`);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess;
let mcpProcess;
let mcpRl;
let mcpRequestId = 1;
const pendingRequests = new Map();

function sendMcpRequest(method, params = {}) {
  const id = mcpRequestId++;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }) + '\n';
    mcpProcess.stdin.write(payload);
  });
}

test.before(async () => {
  // Ensure clean test db & tokens
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  if (fs.existsSync(TEST_TOKENS)) fs.unlinkSync(TEST_TOKENS);

  // 1. Start HTTP backend server
  serverProcess = spawn('node', ['server.mjs'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DB_PATH: TEST_DB,
      NODE_ENV: 'test',
    },
    stdio: 'pipe',
  });

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(serverReady, true, 'Backend test server failed to start');

  // 2. Start MCP server process
  mcpProcess = spawn('node', ['bin/mcp-server.mjs'], {
    env: {
      ...process.env,
      MDV_SERVER: BASE_URL,
      MDV_TOKENS_FILE: TEST_TOKENS,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  mcpRl = readline.createInterface({
    input: mcpProcess.stdout,
    terminal: false,
  });

  mcpRl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        resolve(msg);
      }
    } catch (err) {
      console.error('Failed to parse MCP stdout line:', line, err);
    }
  });
});

test.after(() => {
  if (mcpProcess) {
    mcpProcess.kill('SIGTERM');
  }
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  try {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    if (fs.existsSync(TEST_TOKENS)) fs.unlinkSync(TEST_TOKENS);
  } catch {}
});

test('MCP Protocol - initialize handshake', async () => {
  const res = await sendMcpRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0' },
  });

  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.result.serverInfo.name, 'md-viewer');
  assert.equal(res.result.serverInfo.version, '1.0.0');
  assert.ok(res.result.capabilities.tools);
});

test('MCP Protocol - ping returns empty object', async () => {
  const res = await sendMcpRequest('ping');
  assert.deepEqual(res.result, {});
});

test('MCP Protocol - tools/list returns publish, update, and get tools', async () => {
  const res = await sendMcpRequest('tools/list');
  assert.ok(Array.isArray(res.result.tools));
  const toolNames = res.result.tools.map((t) => t.name);
  assert.ok(toolNames.includes('publish_document'));
  assert.ok(toolNames.includes('update_document'));
  assert.ok(toolNames.includes('get_document'));

  const pubTool = res.result.tools.find((t) => t.name === 'publish_document');
  assert.deepEqual(pubTool.inputSchema.required, ['content']);
});

test('MCP Protocol - handles unknown method gracefully with code -32601', async () => {
  const res = await sendMcpRequest('nonexistent_method', {});
  assert.ok(res.error);
  assert.equal(res.error.code, -32601);
});

test('MCP Tool - publish_document creates new shareable URL and caches token', async () => {
  const res = await sendMcpRequest('tools/call', {
    name: 'publish_document',
    arguments: {
      content: '# MCP Integration Spec\n\nThis is a test document published via MCP.',
      title: 'MCP Integration Spec',
      expire: '7d',
    },
  });

  assert.equal(res.result.isError, false);
  const text = res.result.content[0].text;
  assert.ok(text.includes('published successfully'));
  assert.ok(text.includes('MCP Integration Spec'));
  assert.ok(text.includes('URL:'));

  // Verify tokens were saved to TEST_TOKENS file
  assert.ok(fs.existsSync(TEST_TOKENS));
  const tokens = JSON.parse(fs.readFileSync(TEST_TOKENS, 'utf8'));
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0].title, 'MCP Integration Spec');
  assert.ok(tokens[0].editToken);
  assert.ok(tokens[0].id);
});

test('MCP Tool - get_document retrieves published content by ID and full URL', async () => {
  const tokens = JSON.parse(fs.readFileSync(TEST_TOKENS, 'utf8'));
  const docId = tokens[0].id;

  // 1. Get by doc ID
  const resById = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: docId },
  });
  assert.equal(resById.result.isError, false);
  assert.ok(resById.result.content[0].text.includes('# MCP Integration Spec'));
  assert.ok(resById.result.content[0].text.includes('This is a test document published via MCP.'));

  // 2. Get by full short URL
  const resByUrl = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: `${BASE_URL}/s/${docId}` },
  });
  assert.equal(resByUrl.result.isError, false);
  assert.ok(resByUrl.result.content[0].text.includes('# MCP Integration Spec'));
});

test('MCP Tool - update_document uses cached token to update existing document', async () => {
  const tokens = JSON.parse(fs.readFileSync(TEST_TOKENS, 'utf8'));
  const docId = tokens[0].id;

  // Update without specifying editToken (should auto-resolve from TEST_TOKENS)
  const res = await sendMcpRequest('tools/call', {
    name: 'update_document',
    arguments: {
      id: docId,
      title: 'Updated MCP Integration Spec',
      content: '# Updated MCP Integration Spec\n\nContent has been updated via MCP tool.',
    },
  });

  assert.equal(res.result.isError, false);
  assert.ok(res.result.content[0].text.includes('updated successfully'));

  // Verify updated content using get_document
  const getRes = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: docId },
  });
  assert.equal(getRes.result.isError, false);
  assert.ok(getRes.result.content[0].text.includes('Content has been updated via MCP tool.'));
});

test('MCP Tool - rejects empty content or invalid ID with isError: true', async () => {
  const resEmpty = await sendMcpRequest('tools/call', {
    name: 'publish_document',
    arguments: { content: '   ' },
  });
  assert.equal(resEmpty.result.isError, true);

  const resNotFound = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: 'nonexistent99' },
  });
  assert.equal(resNotFound.result.isError, true);
});

test('MCP Tool - publish_document with password and unlock via get_document', async () => {
  const publishRes = await sendMcpRequest('tools/call', {
    name: 'publish_document',
    arguments: {
      title: 'MCP Protected Spec',
      content: '# Confidential Architecture\nThis is secret.',
      password: 'mcp-secret-pass',
    },
  });

  assert.equal(publishRes.result.isError, false);
  const text = publishRes.result.content[0].text;
  assert.ok(text.includes('Password protected'));
  const idMatch = text.match(/• ID:\s*([a-zA-Z0-9]+)/);
  assert.ok(idMatch);
  const docId = idMatch[1];

  // 1. get_document without password -> should report error asking for password
  const lockedRes = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: docId },
  });
  assert.equal(lockedRes.result.isError, true);
  assert.ok(lockedRes.result.content[0].text.includes('password'));

  // 2. get_document with correct password -> should reveal content
  const unlockedRes = await sendMcpRequest('tools/call', {
    name: 'get_document',
    arguments: { id: docId, password: 'mcp-secret-pass' },
  });
  assert.equal(unlockedRes.result.isError, false);
  assert.ok(unlockedRes.result.content[0].text.includes('Confidential Architecture'));
});
