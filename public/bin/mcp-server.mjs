#!/usr/bin/env node
/**
 * ==============================================================================
 * mdv MCP Server - Model Context Protocol for md-viewer
 * Provides stdio JSON-RPC 2.0 tools for AI assistants (Claude, Cursor, Cline, etc.)
 * Zero external dependencies: pure Node.js v18+ native stdio and fetch.
 * ==============================================================================
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const VERSION = '1.0.0';
const DEFAULT_SERVER = 'https://md-viewer.e21.dev';
const SERVER = (process.env.MDV_SERVER || DEFAULT_SERVER).replace(/\/+$/, '');

function getConfigDir() {
  if (process.env.MDV_CONFIG_DIR) return process.env.MDV_CONFIG_DIR;
  if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, 'mdv');
  return path.join(os.homedir(), '.config', 'mdv');
}

function getTokensFile() {
  if (process.env.MDV_TOKENS_FILE) return process.env.MDV_TOKENS_FILE;
  return path.join(getConfigDir(), 'tokens.json');
}

function loadTokens() {
  const file = getTokensFile();
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    process.stderr.write(`[mdv-mcp] Warning: unable to read tokens: ${err.message}\n`);
  }
  return [];
}

function saveToken(tokenRecord) {
  const file = getTokensFile();
  const dir = path.dirname(file);
  try {
    fs.mkdirSync(dir, { recursive: true });
    let list = loadTokens();
    list = list.filter((item) => item.id !== tokenRecord.id);
    list.unshift(tokenRecord);
    list = list.slice(0, 50); // Keep 50 most recent
    fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    process.stderr.write(`[mdv-mcp] Warning: unable to persist token: ${err.message}\n`);
  }
}

function findToken(docId) {
  const tokens = loadTokens();
  const found = tokens.find((item) => item.id === docId);
  return found?.editToken || null;
}

function extractDocId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/s\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return trimmed;
}

function extractTitle(content) {
  if (!content || typeof content !== 'string') return 'Untitled Document';
  // Check YAML frontmatter: title: ...
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^\s*title\s*:\s*["']?(.*?)["']?\s*$/m);
    if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
  }
  // Check ATX Heading (# Title)
  const atxMatch = content.match(/^[ \t]*#[ \t]+(.+)$/m);
  if (atxMatch && atxMatch[1]) {
    return atxMatch[1].replace(/[`*_[\]]/g, '').trim();
  }
  // Check Setext Heading (Title \n ===)
  const setextMatch = content.match(/^([^\n]+)\n={3,}/m);
  if (setextMatch && setextMatch[1]) {
    return setextMatch[1].replace(/[`*_[\]]/g, '').trim();
  }
  return 'Untitled Document';
}

function calculateExpiresAt(expire) {
  const now = Date.now();
  switch (expire) {
    case '7d':
    case '7':
      return now + 7 * 86400 * 1000;
    case '30d':
    case '30':
      return now + 30 * 86400 * 1000;
    case '1y':
    case '365d':
      return now + 365 * 86400 * 1000;
    case 'never':
    default:
      return null;
  }
}

// MCP Tools Definition
const TOOLS = [
  {
    name: 'publish_document',
    description:
      'Publish markdown content to https://md-viewer.e21.dev and return a shareable short URL. Edit token is automatically saved locally to ~/.config/mdv/tokens.json for future updates.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The Markdown text content to publish.',
        },
        title: {
          type: 'string',
          description:
            'Optional document title. If omitted, auto-detected from the first heading or frontmatter.',
        },
        expire: {
          type: 'string',
          enum: ['never', '7d', '30d', '1y'],
          description: 'Optional expiration duration (default: never).',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_document',
    description:
      'Update an existing shared Markdown document on https://md-viewer.e21.dev. Author edit token is automatically retrieved from ~/.config/mdv/tokens.json if not provided.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The 7-character document ID (e.g., mQQSZ3K) or full URL (/s/mQQSZ3K).',
        },
        content: {
          type: 'string',
          description: 'The updated Markdown text content.',
        },
        title: {
          type: 'string',
          description: 'Optional updated document title. If omitted, existing title is kept.',
        },
        editToken: {
          type: 'string',
          description:
            'Optional author edit token. If omitted, looked up automatically from ~/.config/mdv/tokens.json.',
        },
      },
      required: ['id', 'content'],
    },
  },
  {
    name: 'get_document',
    description:
      'Retrieve Markdown content, title, and metadata for a shared document from https://md-viewer.e21.dev.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The 7-character document ID (e.g., mQQSZ3K) or full URL (/s/mQQSZ3K).',
        },
      },
      required: ['id'],
    },
  },
];

// Tool Executors
async function executePublishDocument(args) {
  const content = args.content;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return {
      content: [{ type: 'text', text: 'Error: Content cannot be empty.' }],
      isError: true,
    };
  }

  const title = (args.title && typeof args.title === 'string' && args.title.trim())
    ? args.title.trim()
    : extractTitle(content);

  const expiresAt = calculateExpiresAt(args.expire);

  const payload = {
    title,
    content,
    expiresAt,
  };

  const response = await fetch(`${SERVER}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.shortUrl) {
    const errorMsg = data.error || `HTTP ${response.status} ${response.statusText}`;
    return {
      content: [{ type: 'text', text: `Failed to publish document: ${errorMsg}` }],
      isError: true,
    };
  }

  // Persist token to ~/.config/mdv/tokens.json
  saveToken({
    id: data.id,
    url: data.shortUrl,
    title: data.title || title,
    editToken: data.editToken,
    createdAt: data.createdAt || Date.now(),
  });

  const expireText = args.expire && args.expire !== 'never' ? args.expire : 'Never';
  const outputText = [
    '✓ Markdown document published successfully!',
    `• URL: ${data.shortUrl}`,
    `• ID: ${data.id}`,
    `• Title: ${data.title || title}`,
    `• Expires: ${expireText}`,
    `• Edit Token: (saved to ~/.config/mdv/tokens.json)`,
  ].join('\n');

  return {
    content: [{ type: 'text', text: outputText }],
    isError: false,
  };
}

async function executeUpdateDocument(args) {
  const rawId = args.id;
  const docId = extractDocId(rawId);
  if (!docId) {
    return {
      content: [{ type: 'text', text: 'Error: Valid document ID is required.' }],
      isError: true,
    };
  }

  const content = args.content;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return {
      content: [{ type: 'text', text: 'Error: Content cannot be empty.' }],
      isError: true,
    };
  }

  let editToken = args.editToken;
  if (!editToken || typeof editToken !== 'string') {
    editToken = findToken(docId);
  }

  if (!editToken) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: Edit token is required to update document '${docId}'. It was not provided in arguments and was not found in ${getTokensFile()}.`,
        },
      ],
      isError: true,
    };
  }

  const payload = { content };
  if (args.title && typeof args.title === 'string' && args.title.trim()) {
    payload.title = args.title.trim();
  }

  const response = await fetch(`${SERVER}/api/share/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Edit-Token': editToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    const errorMsg = data.error || `HTTP ${response.status} ${response.statusText}`;
    return {
      content: [{ type: 'text', text: `Failed to update document: ${errorMsg}` }],
      isError: true,
    };
  }

  // Update token cache with new title & timestamp if present
  saveToken({
    id: docId,
    url: data.shortUrl || `${SERVER}/s/${docId}`,
    title: data.title || args.title || 'Updated Document',
    editToken,
    createdAt: data.createdAt || Date.now(),
  });

  const outputText = [
    '✓ Markdown document updated successfully!',
    `• URL: ${data.shortUrl || `${SERVER}/s/${docId}`}`,
    `• ID: ${docId}`,
    `• Title: ${data.title || args.title || 'Untitled'}`,
    `• Updated At: ${new Date(data.updatedAt || Date.now()).toISOString().replace('T', ' ').slice(0, 16)} UTC`,
  ].join('\n');

  return {
    content: [{ type: 'text', text: outputText }],
    isError: false,
  };
}

async function executeGetDocument(args) {
  const rawId = args.id;
  const docId = extractDocId(rawId);
  if (!docId) {
    return {
      content: [{ type: 'text', text: 'Error: Valid document ID is required.' }],
      isError: true,
    };
  }

  const response = await fetch(`${SERVER}/api/share/${encodeURIComponent(docId)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status} ${response.statusText}`;
    return {
      content: [{ type: 'text', text: `Failed to retrieve document: ${errorMsg}` }],
      isError: true,
    };
  }

  const outputText = [
    `# ${data.title || 'Untitled Document'}`,
    `ID: ${data.id}`,
    `URL: ${SERVER}/s/${data.id}`,
    `Views: ${data.views || 0}`,
    `Created: ${new Date(data.createdAt).toISOString().replace('T', ' ').slice(0, 16)} UTC`,
    `Expires: ${data.expiresAt ? new Date(data.expiresAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : 'Never'}`,
    '',
    '--- Markdown Content ---',
    data.content || '',
  ].join('\n');

  return {
    content: [{ type: 'text', text: outputText }],
    isError: false,
  };
}

async function handleToolCall(name, args) {
  switch (name) {
    case 'publish_document':
      return await executePublishDocument(args);
    case 'update_document':
      return await executeUpdateDocument(args);
    case 'get_document':
      return await executeGetDocument(args);
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool name: ${name}` }],
        isError: true,
      };
  }
}

// JSON-RPC 2.0 stdio message loop
function sendMessage(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    sendMessage({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` },
    });
    return;
  }

  // Handle Notifications (requests without an id)
  if (request.id === undefined || request.id === null) {
    // notifications/initialized or other client notifications require no response
    return;
  }

  const { id, method, params } = request;

  switch (method) {
    case 'initialize': {
      sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'md-viewer',
            version: VERSION,
          },
        },
      });
      break;
    }

    case 'ping': {
      sendMessage({
        jsonrpc: '2.0',
        id,
        result: {},
      });
      break;
    }

    case 'tools/list': {
      sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS,
        },
      });
      break;
    }

    case 'tools/call': {
      try {
        const result = await handleToolCall(params?.name, params?.arguments || {});
        sendMessage({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (err) {
        sendMessage({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Execution error: ${err.message}` }],
            isError: true,
          },
        });
      }
      break;
    }

    default: {
      sendMessage({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      });
      break;
    }
  }
});

rl.on('close', () => {
  process.exit(0);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
