import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Automatically load .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch (_) {}

// Setup Database
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'shared_docs.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
  CREATE TABLE IF NOT EXISTS shared_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    expires_at INTEGER,
    views INTEGER DEFAULT 0,
    edit_token TEXT,
    password_hash TEXT,
    password_salt TEXT,
    burn_after_read INTEGER DEFAULT 0,
    is_burned INTEGER DEFAULT 0,
    burned_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_shared_expires ON shared_documents(expires_at);

  CREATE TABLE IF NOT EXISTS document_views (
    doc_id TEXT NOT NULL,
    client_hash TEXT NOT NULL,
    last_viewed_at INTEGER NOT NULL,
    PRIMARY KEY (doc_id, client_hash)
  );
  CREATE INDEX IF NOT EXISTS idx_doc_views_cleanup ON document_views(last_viewed_at);
`);

// Safe migrations if table previously existed without columns
try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN edit_token TEXT;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN updated_at INTEGER;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN password_hash TEXT;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN password_salt TEXT;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN burn_after_read INTEGER DEFAULT 0;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN is_burned INTEGER DEFAULT 0;');
} catch {}

try {
  db.exec('ALTER TABLE shared_documents ADD COLUMN burned_at INTEGER;');
} catch {}

// Prepared statements
const stmtInsert = db.prepare(`
  INSERT INTO shared_documents (
    id, title, content, created_at, updated_at, expires_at, views, edit_token,
    password_hash, password_salt, burn_after_read, is_burned, burned_at
  )
  VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, NULL)
`);

const stmtGet = db.prepare(`
  SELECT * FROM shared_documents WHERE id = ?
`);

const stmtUpdateWithSecurity = db.prepare(`
  UPDATE shared_documents
  SET title = ?, content = ?, updated_at = ?, password_hash = ?, password_salt = ?, burn_after_read = ?
  WHERE id = ?
`);

const stmtMarkBurned = db.prepare(`
  UPDATE shared_documents
  SET content = '', is_burned = 1, burned_at = ?
  WHERE id = ?
`);

const stmtIncrementViews = db.prepare(`
  UPDATE shared_documents SET views = views + 1 WHERE id = ?
`);

const stmtGetView = db.prepare(`
  SELECT last_viewed_at FROM document_views WHERE doc_id = ? AND client_hash = ?
`);

const stmtUpsertView = db.prepare(`
  INSERT OR REPLACE INTO document_views (doc_id, client_hash, last_viewed_at)
  VALUES (?, ?, ?)
`);

const stmtCleanupOldViews = db.prepare(`
  DELETE FROM document_views WHERE last_viewed_at < ?
`);

const stmtDeleteExpired = db.prepare(`
  DELETE FROM shared_documents WHERE expires_at IS NOT NULL AND expires_at < ?
`);

// Password hashing & timing-safe verification
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  try {
    const computed = hashPassword(password, salt);
    const bufA = Buffer.from(computed, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Anti-brute force rate limiting map for document unlocking (max 5 failed attempts per min per IP+doc)
const unlockAttemptsMap = new Map();
const UNLOCK_WINDOW_MS = 60 * 1000;
const MAX_UNLOCK_ATTEMPTS = 5;

setInterval(() => {
  const cutoff = Date.now() - UNLOCK_WINDOW_MS;
  for (const [key, entry] of unlockAttemptsMap.entries()) {
    if (entry.startTime < cutoff) unlockAttemptsMap.delete(key);
  }
}, 300000);

function isUnlockRateLimited(ip, docId) {
  const key = `${ip}:${docId}`;
  const now = Date.now();
  const entry = unlockAttemptsMap.get(key);
  if (!entry) return false;
  if (now - entry.startTime > UNLOCK_WINDOW_MS) {
    unlockAttemptsMap.delete(key);
    return false;
  }
  return entry.attempts >= MAX_UNLOCK_ATTEMPTS;
}

function recordUnlockAttempt(ip, docId, success) {
  const key = `${ip}:${docId}`;
  if (success) {
    unlockAttemptsMap.delete(key);
    return;
  }
  const now = Date.now();
  const entry = unlockAttemptsMap.get(key);
  if (!entry || now - entry.startTime > UNLOCK_WINDOW_MS) {
    unlockAttemptsMap.set(key, { startTime: now, attempts: 1 });
  } else {
    entry.attempts++;
  }
}

// Generate unambiguous 7-character base62 string
const CHARS = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
function generateShortId(length = 7) {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return id;
}

// Generate secure 48-char hex token for document author edit authorization
function generateEditToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Bot / Crawler detection to prevent automated previews from inflating view counts
const BOT_USER_AGENTS = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|curl|wget|python-requests|node-fetch|got|axios|preview|metatags/i;

function isBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return BOT_USER_AGENTS.test(userAgent);
}

// Client hash deduplication (SHA-256 of salt + client IP + optional client visitor ID)
const VIEW_SALT = process.env.VIEW_SALT || 'md-viewer-view-salt-2026';
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

function getClientHash(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown_ip';
  const visitorId = (req.headers['x-visitor-id'] || req.query.visitorId || '').toString().trim();
  return crypto.createHash('sha256').update(`${VIEW_SALT}:${ip}:${visitorId}`).digest('hex');
}

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'self';"
  );
  next();
});

// Middleware
app.use(express.json({ limit: '15mb' }));

// API: Health Check (Liveness & Readiness Probe)
app.get('/api/health', (req, res) => {
  try {
    const row = db.prepare('SELECT 1 as alive').get();
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      timestamp: Date.now(),
      database: row && row.alive === 1 ? 'connected' : 'error',
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// Periodic cleanup of expired links & old view logs (every hour)
setInterval(() => {
  try {
    const now = Date.now();
    stmtDeleteExpired.run(now);
    // Cleanup view logs older than 48 hours to keep database compact
    stmtCleanupOldViews.run(now - (48 * 60 * 60 * 1000));
  } catch (err) {
    console.error('Periodic cleanup error:', err);
  }
}, 3600000);

// Rate limiting map for document sharing (max 20 shares per minute per IP)
const shareRateLimitMap = new Map();
const SHARE_RATE_LIMIT = 20;
const SHARE_WINDOW_MS = 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - SHARE_WINDOW_MS;
  for (const [ip, record] of shareRateLimitMap.entries()) {
    if (record.startTime < cutoff) shareRateLimitMap.delete(ip);
  }
}, 600000);

// API: Create Shared Document
app.post('/api/share', (req, res) => {
  try {
    const { title, content, expiresAt, password, burnAfterRead } = req.body || {};

    // IP-based Rate Limiting
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
    const now = Date.now();
    const clientRecord = shareRateLimitMap.get(clientIp);
    if (clientRecord && now - clientRecord.startTime < SHARE_WINDOW_MS) {
      if (clientRecord.count >= SHARE_RATE_LIMIT) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute before sharing another document.' });
      }
      clientRecord.count++;
    } else {
      shareRateLimitMap.set(clientIp, { startTime: now, count: 1 });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Markdown content is required.' });
    }

    if (content.length > 1000000) {
      return res.status(413).json({ error: 'Document exceeds maximum allowed size (1 MB).' });
    }

    const docTitle = (title && typeof title === 'string') ? title.trim().slice(0, 200) : 'Untitled Document';
    const createdAt = Date.now();
    const updatedAt = createdAt;
    const expiration = (typeof expiresAt === 'number' && expiresAt > createdAt) ? expiresAt : null;

    let passwordHash = null;
    let passwordSalt = null;
    if (password && typeof password === 'string' && password.trim().length > 0) {
      passwordSalt = crypto.randomBytes(16).toString('hex');
      passwordHash = hashPassword(password.trim(), passwordSalt);
    }

    const isBurn = (burnAfterRead === true || burnAfterRead === 'true' || burnAfterRead === 1) ? 1 : 0;

    // Retry on collision (extremely unlikely with 56^7 combinations)
    let shortId = generateShortId(7);
    let attempts = 0;
    while (stmtGet.get(shortId) && attempts < 5) {
      shortId = generateShortId(7);
      attempts++;
    }

    const editToken = generateEditToken();
    stmtInsert.run(shortId, docTitle, content, createdAt, updatedAt, expiration, editToken, passwordHash, passwordSalt, isBurn);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'md-viewer.e21.dev';
    const shortUrl = `${protocol}://${host}/s/${shortId}`;

    return res.status(201).json({
      id: shortId,
      shortUrl,
      editToken,
      title: docTitle,
      createdAt,
      updatedAt,
      expiresAt: expiration,
      views: 0,
      isProtected: Boolean(passwordHash),
      isBurnAfterRead: Boolean(isBurn),
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    return res.status(500).json({ error: 'Failed to generate share link.' });
  }
});

// API: Update Shared Document (requires edit token)
app.put('/api/share/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID dokumen tidak valid.' });
    }

    const editToken = req.headers['x-edit-token'] || req.body?.editToken;
    if (!editToken || typeof editToken !== 'string') {
      return res.status(401).json({ error: 'Edit token diperlukan untuk memperbarui dokumen ini.' });
    }

    const row = stmtGet.get(id);
    if (!row) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan atau tautan sudah dihapus.' });
    }

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      try {
        db.prepare('DELETE FROM shared_documents WHERE id = ?').run(id);
      } catch {}
      return res.status(410).json({ error: 'Tautan dokumen ini telah kadaluarsa.' });
    }

    // Authorization check
    if (!row.edit_token || row.edit_token !== editToken.trim()) {
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses (token tidak cocok) untuk memperbarui tautan ini.' });
    }

    const { title, content } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Konten markdown diperlukan.' });
    }

    const docTitle = (title && typeof title === 'string') ? title.trim().slice(0, 200) : row.title;
    const updatedAt = Date.now();

    let passHash = row.password_hash;
    let passSalt = row.password_salt;
    let burnSetting = row.burn_after_read || 0;

    if (req.body?.password !== undefined) {
      if (typeof req.body.password === 'string' && req.body.password.trim().length > 0) {
        passSalt = crypto.randomBytes(16).toString('hex');
        passHash = hashPassword(req.body.password.trim(), passSalt);
      } else if (req.body.password === '' || req.body.password === null) {
        passHash = null;
        passSalt = null;
      }
    }

    if (req.body?.burnAfterRead !== undefined) {
      burnSetting = Boolean(req.body.burnAfterRead) ? 1 : 0;
    }

    stmtUpdateWithSecurity.run(docTitle, content, updatedAt, passHash, passSalt, burnSetting, id);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'md-viewer.e21.dev';
    const shortUrl = `${protocol}://${host}/s/${id}`;

    return res.json({
      success: true,
      id,
      shortUrl,
      title: docTitle,
      updatedAt,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      views: row.views || 0,
      isProtected: Boolean(passHash),
      isBurnAfterRead: Boolean(burnSetting),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Gagal memperbarui dokumen.' });
  }
});

// Helper to retrieve or unlock shared document
function handleRetrieveDocument(req, res) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }

    const row = stmtGet.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Document not found or invalid link.' });
    }

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      try {
        db.prepare('DELETE FROM shared_documents WHERE id = ?').run(id);
      } catch {}
      return res.status(410).json({ error: 'This shared link has expired.' });
    }

    // Check if burned (self-destructed)
    if (row.is_burned === 1) {
      return res.status(410).json({
        error: 'Dokumen ini telah dilihat dan telah dihancurkan secara otomatis.',
        isBurned: true,
        title: row.title,
      });
    }

    // Check if requester is document author (via x-edit-token header, body, or query parameter)
    const incomingEditToken = req.headers['x-edit-token'] || req.body?.editToken || req.query.editToken;
    const isAuthor = Boolean(incomingEditToken && row.edit_token && incomingEditToken.trim() === row.edit_token.trim());

    // Check password protection
    const hasPassword = Boolean(row.password_hash);
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();

    if (hasPassword && !isAuthor) {
      const incomingPassword = req.headers['x-doc-password'] || req.headers['x-password'] || req.body?.password || req.query.password;
      if (!incomingPassword) {
        // Return document metadata without content so client prompts for password
        return res.json({
          id: row.id,
          title: row.title,
          isProtected: true,
          isBurnAfterRead: Boolean(row.burn_after_read),
          createdAt: row.created_at,
          updatedAt: row.updated_at || row.created_at,
          expiresAt: row.expires_at,
          views: row.views || 0,
        });
      }

      if (isUnlockRateLimited(clientIp, id)) {
        return res.status(429).json({
          error: 'Terlalu banyak percobaan kata sandi yang salah. Silakan tunggu 1 menit.',
          isRateLimited: true,
        });
      }

      const isValid = verifyPassword(String(incomingPassword), row.password_salt, row.password_hash);
      recordUnlockAttempt(clientIp, id, isValid);

      if (!isValid) {
        return res.status(401).json({
          error: 'Kata sandi salah.',
          isInvalidPassword: true,
        });
      }
    }

    // Check if requester is a bot / crawler preview
    const userAgent = req.headers['user-agent'] || '';
    const botRequest = isBot(userAgent);

    // If document is burn-after-read:
    if (row.burn_after_read === 1 && !isAuthor && !botRequest) {
      // Burn the document immediately upon successful read!
      const now = Date.now();
      stmtMarkBurned.run(now, id);
      stmtIncrementViews.run(id);

      return res.json({
        id: row.id,
        title: row.title,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        expiresAt: row.expires_at,
        views: (row.views || 0) + 1,
        isProtected: hasPassword,
        isBurnAfterRead: true,
        isBurnedNow: true,
      });
    }

    let currentViews = row.views || 0;

    if (!isAuthor && !botRequest) {
      const clientHash = getClientHash(req);
      const existingView = stmtGetView.get(id, clientHash);
      const now = Date.now();

      if (!existingView || (now - existingView.last_viewed_at) >= VIEW_COOLDOWN_MS) {
        stmtIncrementViews.run(id);
        stmtUpsertView.run(id, clientHash, now);
        currentViews += 1;
      }
    }

    return res.json({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      expiresAt: row.expires_at,
      views: currentViews,
      isProtected: hasPassword,
      isBurnAfterRead: Boolean(row.burn_after_read),
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to retrieve document.' });
  }
}

// API: Retrieve Shared Document (GET)
app.get('/api/share/:id', handleRetrieveDocument);

// API: Unlock Protected Shared Document (POST)
app.post('/api/share/:id/unlock', handleRetrieveDocument);

// 9router AI Configuration & Helper
const ROUTER_HOSTS = [
  process.env.LOCAL_LLM_HOST,
  'http://172.17.0.1:20128/v1',
  'http://127.0.0.1:20128/v1',
  'http://host.docker.internal:20128/v1',
].filter(Boolean);

const ROUTER_KEY = process.env.LOCAL_LLM_KEY || '';
const ROUTER_MODEL = process.env.LOCAL_LLM_MODEL || 'ag/gemini-3.7-flash-low';

async function callRouterCompletion(messages, maxTokens = 600) {
  if (!ROUTER_KEY) {
    throw new Error('LOCAL_LLM_KEY is not configured on the server. Please provide it via environment variable or .env');
  }
  let lastError = null;
  for (const host of ROUTER_HOSTS) {
    try {
      const endpoint = `${host.replace(/\/+$/, '')}/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ROUTER_KEY}`,
        },
        body: JSON.stringify({
          model: ROUTER_MODEL,
          messages,
          stream: false,
          max_tokens: maxTokens,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`9router HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to reach 9router AI endpoint');
}

// API: Summarize Document via 9router AI
app.post('/api/summarize', async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Konten dokumen kosong.' });
    }

    // Truncate to reasonable context if very large (> 40,000 chars)
    const truncatedContent = content.length > 40000
      ? `${content.slice(0, 40000)}\n\n[...dokumen dipotong...]`
      : content;

    const systemPrompt = `You are an expert editorial technical summarizer.
Analyze the provided markdown document and generate an accurate, structured summary.
Rules:
1. Detect and match the language of the document (if Indonesian, write in Indonesian; if English, write in English).
2. Output valid JSON ONLY with this exact format:
{
  "tldr": "1 or 2 punchy, insightful sentences capturing the core idea.",
  "takeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ]
}
3. Be specific, insightful, and concise. Avoid generic fluff. Do not wrap in markdown code blocks.`;

    const userPrompt = `Document Title: ${title || 'Untitled'}\n\nContent:\n${truncatedContent}`;

    const rawResponse = await callRouterCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 600);

    const cleaned = rawResponse.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const tldrMatch = cleaned.match(/"tldr":\s*"([^"]+)"/);
      parsed = {
        tldr: tldrMatch ? tldrMatch[1] : cleaned.slice(0, 200),
        takeaways: [cleaned.slice(0, 300)],
      };
    }

    return res.json({
      success: true,
      tldr: parsed.tldr || '',
      takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways : [],
    });
  } catch (err) {
    console.error('Error summarizing document:', err);
    return res.status(500).json({ error: 'Gagal membuat ringkasan AI: ' + (err.message || 'Koneksi error') });
  }
});

// Route: Serve mdv binary script directly
app.get('/bin/mdv', (req, res) => {
  const candidates = [
    path.join(__dirname, 'bin', 'mdv'),
    path.join(__dirname, 'public', 'bin', 'mdv'),
    path.join(__dirname, 'dist', 'bin', 'mdv'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(candidate);
    }
  }
  return res.status(404).send('mdv script not found');
});

// Route: Serve installer script directly for curl -fsSL https://md-viewer.e21.dev/install.sh | bash
app.get(['/install.sh', '/install'], (req, res) => {
  const candidates = [
    path.join(__dirname, 'public', 'install.sh'),
    path.join(__dirname, 'dist', 'install.sh'),
    path.join(__dirname, 'install.sh'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(candidate);
    }
  }
  return res.status(404).send('install.sh not found');
});

// Serve static assets from Vite dist
const distPath = process.env.DIST_PATH || path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css|woff2|svg|png|jpg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createSnippet(markdown, maxLength = 160) {
  if (!markdown) return 'Shared Markdown document on MD Viewer.';
  const clean = markdown
    .replace(/^#+\s+/gm, '') // headings
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/<[^>]+>/g, '') // html tags
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, maxLength);
}

// SPA Fallback: Dynamic Meta Injection for /s/:id and Google Verification for /
app.use((req, res) => {
  let indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    const rootIndexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(rootIndexPath)) {
      indexPath = rootIndexPath;
    } else {
      return res.status(404).send('Application bundle not found.');
    }
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Handle Google Search Console verification code injection
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION || '';
  if (googleVerification) {
    if (html.includes('GOOGLE_SITE_VERIFICATION_PLACEHOLDER')) {
      html = html.replace('GOOGLE_SITE_VERIFICATION_PLACEHOLDER', escapeHtml(googleVerification));
    } else if (html.includes('name="google-site-verification"')) {
      html = html.replace(/<meta name="google-site-verification" content=".*?" \/>/, `<meta name="google-site-verification" content="${escapeHtml(googleVerification)}" />`);
    }
  } else {
    html = html.replace(/<meta name="google-site-verification" content=".*?" \/>\s*/, '');
  }

  // Handle Shared Document links: /s/:id
  if (req.path.startsWith('/s/')) {
    const shortId = req.path.replace(/^\/s\//, '').split('/')[0].trim();
    if (shortId) {
      const row = stmtGet.get(shortId);
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'md-viewer.e21.dev';
      const docUrl = `${protocol}://${host}/s/${shortId}`;

      if (row && (!row.expires_at || row.expires_at > Date.now())) {
        if (row.is_burned) {
          const burnedTitle = 'Dokumen Telah Dimusnahkan | MD Viewer';
          const burnedDesc = 'Dokumen ini telah dilihat dan telah dihancurkan secara otomatis.';
          html = html
            .replace(/<title>.*?<\/title>/, `<title>${burnedTitle}</title>`)
            .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${burnedTitle}" />`)
            .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${burnedDesc}" />`)
            .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${burnedTitle}" />`)
            .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${burnedDesc}" />`)
            .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${docUrl}" />`)
            .replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="article" />`)
            .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${burnedTitle}" />`)
            .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${burnedDesc}" />`)
            .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${docUrl}" />`)
            .replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="noindex, nofollow" />`)
            .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${docUrl}" />`);
        } else {
          const isProtected = Boolean(row.password_hash || row.burn_after_read);
          const safeTitle = escapeHtml(row.title || 'Dokumen Bersama');
          const safeDesc = isProtected
            ? 'Dokumen ini dilindungi kata sandi dan bersifat rahasia.'
            : escapeHtml(createSnippet(row.content, 180));
          const fullTitle = `${safeTitle} | MD Viewer`;

          html = html
            .replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)
            .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${fullTitle}" />`)
            .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${safeDesc}" />`)
            .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${fullTitle}" />`)
            .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${safeDesc}" />`)
            .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${docUrl}" />`)
            .replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="article" />`)
            .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${fullTitle}" />`)
            .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${safeDesc}" />`)
            .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${docUrl}" />`)
            .replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="noindex, follow" />`)
            .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${docUrl}" />`);
        }
      } else {
        // Document not found or expired
        const notFoundTitle = 'Dokumen Tidak Ditemukan | MD Viewer';
        html = html
          .replace(/<title>.*?<\/title>/, `<title>${notFoundTitle}</title>`)
          .replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="noindex, nofollow" />`);
      }
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`md-viewer production server running on port ${PORT}`);
  console.log(`Database connected at ${DB_PATH}`);
});
