import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'growth_lab.db');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.webm': 'audio/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read .env if exists
let serverOpenAIKey = process.env.OPENAI_API_KEY || '';
let selectedOpenAIModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
let youtubeApiKey = process.env.YOUTUBE_API_KEY || '';

function loadEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    try {
      const content = fs.readFileSync(ENV_PATH, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        if (key.trim() === 'OPENAI_API_KEY' && val) {
          serverOpenAIKey = val;
        }
        if (key.trim() === 'OPENAI_MODEL' && val) {
          selectedOpenAIModel = val;
        }
        if (key.trim() === 'YOUTUBE_API_KEY' && val) {
          youtubeApiKey = val;
        }
      }
    } catch (e) {
      console.warn('Could not read .env file:', e.message);
    }
  }
}
loadEnvFile();

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    mode TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    role TEXT,
    content TEXT,
    audio_url TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS user_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 8,
    track_id TEXT DEFAULT 'track-brand',
    difficulty TEXT DEFAULT 'Intermediate',
    summary TEXT,
    takeaway TEXT,
    youtube_id TEXT,
    saved INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    user_notes TEXT DEFAULT '',
    published_at TEXT,
    status TEXT DEFAULT 'available',
    is_fresh INTEGER DEFAULT 0,
    suggested_alternative_url TEXT DEFAULT '',
    channel_title TEXT DEFAULT '',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS learning_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  );
`);

console.log(`[Growth Lab Server] Database initialized at ${DB_PATH}`);

// System Prompts for ChatGPT Modes
const SYSTEM_PROMPTS = {
  general: `You are a natural, intelligent conversational assistant (like ChatGPT) for Charu Bansal, an MBA Product Management student.
You respond naturally to whatever she types or says.
Accept single letters, incomplete thoughts, casual remarks, and deep questions with warmth and clarity.
Never block messages for being short.
Do NOT automatically score her or force messages into an evaluation exercise.
Use simple, clear, human English. Talk like a thoughtful peer.
You can discuss any topic—business, technology, daily routines, personal development, or casual questions.`,

  study: `You are Charu Bansal's MBA study assistant.
Help her understand concepts from Product Management II (APIs, databases, cloud, tech debt, ML), Microeconomics (demand, elasticity, costs, market structure), and Market Research Methods.
Explain concepts step by step in simple English using real Indian market analogies (e.g. Jio, Zomato, Amul, Swiggy, Tata).
Preserve necessary academic terminology so she performs well in exams, but demystify the logic.`,

  communication: `You are an interactive spoken communication partner for Charu Bansal.
She is practicing speaking naturally in English.
Respond conversationally, like a smart and supportive colleague in a casual meeting.
Accept short comments, fragments, or spontaneous thoughts without judgment.
Do NOT automatically grade or give communication scores unless she explicitly asks for feedback (e.g. "how did I speak?" or "give me feedback").
Keep the conversation going by making a brief point and asking a natural follow-up question.`,

  'thought-builder': `You are an idea organization partner for Charu Bansal.
Help her structure raw, messy thoughts into clear business arguments using frameworks like Point → Reason → Example (P-R-E), Problem → Analysis → Solution (P-A-S), or Situation → Action → Result (S-A-R).
Preserve her natural personal voice. Don't replace her words with generic corporate jargon.`,

  'brand-coach': `You are an experienced brand strategist having a high-energy discussion with Charu Bansal.
Discuss brand positioning, consumer psychology, pricing power, mental availability, and marketing campaigns in the Indian and global markets.
Challenge weak assumptions gently with Socratic questions. Be curious and analytical.`,

  linkedin: `You are a LinkedIn writing partner for Charu Bansal.
Help her develop authentic, insightful LinkedIn post drafts from her learning observations.
Avoid cringe corporate buzzwords ("humbled and thrilled", "game changer", "synergy").
Focus on strong opening hooks, human storytelling, and clear takeaways.`,
};

// Helper: parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper: parse raw buffer
function parseBufferBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// ========================================================
// LIVE LEARNING LIBRARY ENGINE (RSS, Atom, YouTube & Cache)
// ========================================================

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeTrack(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (text.includes('brand') || text.includes('positioning') || text.includes('logo') || text.includes('rebrand') || text.includes('identity')) {
    return 'track-brand';
  }
  if (text.includes('consumer') || text.includes('psychology') || text.includes('behavior') || text.includes('bias') || text.includes('habit') || text.includes('luxury')) {
    return 'track-consumer';
  }
  if (text.includes('profit') || text.includes('unit economic') || text.includes('margin') || text.includes('pricing') || text.includes('business model') || text.includes('fmcg') || text.includes('retail') || text.includes('b2b')) {
    return 'track-business';
  }
  if (text.includes('story') || text.includes('speak') || text.includes('communication') || text.includes('pitch') || text.includes('presentation')) {
    return 'track-communication';
  }
  if (text.includes('analysis') || text.includes('metric') || text.includes('framework') || text.includes('data')) {
    return 'track-analytical';
  }
  return 'track-brand';
}

async function validateUrlStatus(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok || (res.status >= 200 && res.status < 400)) {
      return 'available';
    }
    if (res.status === 403 || res.status === 401) {
      // Many CDNs like Cloudflare block automated backend requests; browsers still open fine
      return 'unverified';
    }
    return 'unavailable';
  } catch (err) {
    return 'unverified';
  }
}

const INITIAL_VERIFIED_SEEDS = [
  {
    id: 'res-seed-1',
    title: 'Amul’s Genius Marketing Strategy: How a Co-operative Won India',
    source: 'Think School',
    url: 'https://www.youtube.com/watch?v=hy2TaHKyklM',
    type: 'video',
    duration_minutes: 14,
    track_id: 'track-brand',
    difficulty: 'Beginner',
    summary: 'A deep-dive business breakdown of how Verghese Kurien built Amul’s cooperative supply chain, beat multinational giants in India, and turned an umbrella brand into a ₹55,000 Crore titan.',
    takeaway: 'Scale and trusted supply-chain economics beat superior foreign capital when local cultural trust is embedded in the brand core.',
    youtube_id: 'hy2TaHKyklM',
    saved: 1,
    completed: 1,
    published_at: '2026-10-25T10:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-2',
    title: 'Starbucks Looks to Pivot Away from Seasonality Reliance',
    source: 'Marketing Week',
    url: 'https://www.marketingweek.com/starbucks-reliance-seasonality/',
    type: 'article',
    duration_minutes: 7,
    track_id: 'track-brand',
    difficulty: 'Intermediate',
    summary: 'Analyzing how global coffee giant Starbucks is re-engineering its product portfolio and retail experience to maintain consistent daily visits rather than relying solely on seasonal promo spikes.',
    takeaway: 'Sustainable brand equity demands baseline habitual relevance throughout the entire year, not just seasonal novelty.',
    saved: 1,
    completed: 0,
    published_at: '2026-10-28T09:30:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-3',
    title: 'What to Learn from Tropicana’s Packaging Redesign Failure',
    source: 'The Branding Journal',
    url: 'https://www.thebrandingjournal.com/2015/05/what-to-learn-from-tropicanas-packaging-redesign-failure/',
    type: 'article',
    duration_minutes: 6,
    track_id: 'track-brand',
    difficulty: 'Beginner',
    summary: 'A classic branding case study dissecting how removing the iconic orange-with-a-straw visual asset caused a 20% sales plunge in under 2 months.',
    takeaway: 'Never discard distinctive brand assets that consumers use as instant subconscious navigational beacons in retail aisles.',
    saved: 0,
    completed: 0,
    published_at: '2026-10-20T08:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-4',
    title: 'Zomato’s Secret Plan to Become Profitable: Hyperpure Case Study',
    source: 'Think School',
    url: 'https://www.youtube.com/watch?v=-NtB3rf8paE',
    type: 'video',
    duration_minutes: 16,
    track_id: 'track-business',
    difficulty: 'Intermediate',
    summary: 'Teardown of how Zomato built Hyperpure to monetize the B2B restaurant supply chain, solving unit economics while competitors burned capital on consumer discounts.',
    takeaway: 'Backward integration into your customer’s supply chain turns low-margin consumer marketplaces into high-margin B2B enterprise profit engines.',
    youtube_id: '-NtB3rf8paE',
    saved: 1,
    completed: 0,
    published_at: '2026-10-27T14:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-5',
    title: 'The Hallmark Dilemma: Emotional Reassurance vs Commodity',
    source: 'Seth’s Blog · Seth Godin',
    url: 'https://seths.blog/2026/10/the-hallmark-dilemma/',
    type: 'article',
    duration_minutes: 4,
    track_id: 'track-consumer',
    difficulty: 'Beginner',
    summary: 'Seth Godin reflects on why physical cards and deliberate emotional gestures matter more than ever in an era of automated, friction-free digital messaging.',
    takeaway: 'Friction and intentional effort are often what give emotional signaling its true perceived value.',
    saved: 0,
    completed: 0,
    published_at: '2026-10-30T06:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-6',
    title: 'The Radical Jaguar Rebrand: Risk, Polarisation & Modern Identity',
    source: 'The Branding Journal',
    url: 'https://www.thebrandingjournal.com/2024/11/jaguar-rebrand/',
    type: 'article',
    duration_minutes: 8,
    track_id: 'track-brand',
    difficulty: 'Advanced',
    summary: 'An executive teardown of Jaguar’s controversial brand reset, examining the deliberate strategy to shed legacy cues in pursuit of ultra-luxury EV differentiation.',
    takeaway: 'Total brand resets alienate legacy fans to manufacture mental space for completely new customer cohorts.',
    saved: 1,
    completed: 0,
    published_at: '2026-10-29T11:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-7',
    title: 'It’s Time to Embrace Short-Termism If We Want to Grow Brands',
    source: 'Marketing Week · Brand Strategy',
    url: 'https://www.marketingweek.com/short-termism-grow-brands/',
    type: 'article',
    duration_minutes: 9,
    track_id: 'track-business',
    difficulty: 'Intermediate',
    summary: 'Bridging Les Binet & Peter Field’s 60/40 rule with real-world quarterly revenue realities: how brand marketers can fund long-term equity with disciplined short-term activations.',
    takeaway: 'Brand building and performance marketing are not enemies; they are a compounding dual engine.',
    saved: 0,
    completed: 0,
    published_at: '2026-10-31T08:00:00Z',
    status: 'available',
  },
  {
    id: 'res-seed-8',
    title: 'Key Learnings from the Gap Logo Redesign Disaster',
    source: 'The Branding Journal',
    url: 'https://www.thebrandingjournal.com/2021/04/learnings-gap-logo-redesign-fail/',
    type: 'article',
    duration_minutes: 5,
    track_id: 'track-brand',
    difficulty: 'Beginner',
    summary: 'How Gap spent millions on a generic Helvetica logo, faced massive public backlash, and reverted to its original serif square logo within 6 days.',
    takeaway: 'Brand identity is co-owned by the customer community. Redesign without cultural reverence destroys emotional equity.',
    saved: 0,
    completed: 0,
    published_at: '2026-10-22T12:00:00Z',
    status: 'available',
  },
];

function seedLearningResources() {
  const insertStmt = db.prepare(`
    INSERT INTO learning_resources (
      id, title, source, url, type, duration_minutes, track_id, difficulty,
      summary, takeaway, youtube_id, saved, completed, user_notes, published_at,
      status, is_fresh, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, 0, ?)
    ON CONFLICT(url) DO UPDATE SET
      title=excluded.title,
      summary=excluded.summary,
      takeaway=excluded.takeaway,
      youtube_id=excluded.youtube_id,
      status=excluded.status
  `);

  const now = new Date().toISOString();
  for (const item of INITIAL_VERIFIED_SEEDS) {
    try {
      insertStmt.run(
        item.id,
        item.title,
        item.source,
        item.url,
        item.type,
        item.duration_minutes,
        item.track_id,
        item.difficulty,
        item.summary,
        item.takeaway,
        item.youtube_id || null,
        item.saved,
        item.completed,
        item.published_at,
        item.status,
        now
      );
    } catch (e) {
      console.warn('[Learning Engine] Seed note:', e.message);
    }
  }

  // Also remove or replace legacy broken rows if they exist
  try {
    db.prepare("DELETE FROM learning_resources WHERE youtube_id = 'kYJc7K-yRz0' OR youtube_id = '1xNqXq3qG3U'").run();
  } catch (e) {}

  console.log('[Learning Engine] Verified initial resources initialized in database.');
}

async function refreshLearningContent() {
  console.log('[Learning Engine] Starting automatic content refresh across live feeds...');
  const newItems = [];
  const now = new Date().toISOString();

  // 1. YouTube: Think School official Atom feed
  try {
    const ytFeedRes = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCKZozRVHRYsYHGEyNKuhhdA', {
      signal: AbortSignal.timeout(6000),
    });
    if (ytFeedRes.ok) {
      const xml = await ytFeedRes.text();
      const entries = [...xml.matchAll(/<entry>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<published>(.*?)<\/published>[\s\S]*?<media:description>([\s\S]*?)<\/media:description>[\s\S]*?<\/entry>/g)].slice(0, 5);

      for (const e of entries) {
        const title = stripHtml(e[1]);
        const vidId = e[2];
        const publishedAt = e[3];
        const desc = stripHtml(e[4]).slice(0, 240);
        const url = `https://www.youtube.com/watch?v=${vidId}`;

        newItems.push({
          id: `res-yt-${vidId}`,
          title,
          source: 'Think School',
          url,
          type: 'video',
          duration_minutes: 15,
          track_id: categorizeTrack(title, desc),
          difficulty: 'Intermediate',
          summary: desc || `Business and marketing case study breakdown from Think School analyzing ${title}.`,
          takeaway: `Study the consumer friction point and strategic economics behind ${title.replace(/\?|\!/g, '')}.`,
          youtube_id: vidId,
          published_at: publishedAt,
          status: 'available',
          is_fresh: 1,
        });
      }
      console.log(`[Learning Engine] Fetched ${entries.length} recent Think School videos.`);
    }
  } catch (err) {
    console.warn('[Learning Engine] Think School feed check failed:', err.message);
  }

  // 2. Marketing Week RSS Feed
  try {
    const mwRes = await fetch('https://www.marketingweek.com/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (mwRes.ok) {
      const xml = await mwRes.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>[\s\S]*?<\/item>/g)].slice(0, 4);

      for (const item of items) {
        const title = stripHtml(item[1]);
        const link = item[2].trim();
        const publishedAt = item[3] ? new Date(item[3]).toISOString() : now;
        const summary = stripHtml(item[4]).slice(0, 260) || 'Marketing intelligence on category dynamics and customer leadership.';

        newItems.push({
          id: `res-mw-${Buffer.from(link).toString('base64').slice(0, 12)}`,
          title,
          source: 'Marketing Week',
          url: link,
          type: 'article',
          duration_minutes: 7,
          track_id: categorizeTrack(title, summary),
          difficulty: 'Intermediate',
          summary,
          takeaway: `Examine the commercial trade-off: how ${title} balances short-term sales demand against enduring brand mental availability.`,
          youtube_id: null,
          published_at: publishedAt,
          status: 'available',
          is_fresh: 1,
        });
      }
      console.log(`[Learning Engine] Fetched ${items.length} Marketing Week articles.`);
    }
  } catch (err) {
    console.warn('[Learning Engine] Marketing Week feed check failed:', err.message);
  }

  // 3. Seth Godin's Blog RSS Feed
  try {
    const sethRes = await fetch('https://seths.blog/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (sethRes.ok) {
      const xml = await sethRes.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>[\s\S]*?<\/item>/g)].slice(0, 3);

      for (const item of items) {
        const title = stripHtml(item[1]);
        const link = item[2].trim();
        const publishedAt = item[3] ? new Date(item[3]).toISOString() : now;
        const summary = stripHtml(item[4]).slice(0, 240) || 'Seth Godin on cultural empathy, marketing ethics, and intentional storytelling.';

        newItems.push({
          id: `res-seth-${Buffer.from(link).toString('base64').slice(0, 12)}`,
          title,
          source: 'Seth’s Blog',
          url: link,
          type: 'article',
          duration_minutes: 4,
          track_id: 'track-consumer',
          difficulty: 'Beginner',
          summary,
          takeaway: `Reflect on human motivation: true marketing is the generous act of helping others solve a problem.`,
          youtube_id: null,
          published_at: publishedAt,
          status: 'available',
          is_fresh: 1,
        });
      }
      console.log(`[Learning Engine] Fetched ${items.length} Seth Godin entries.`);
    }
  } catch (err) {
    console.warn('[Learning Engine] Seth Godin feed check failed:', err.message);
  }

  // 4. Lenny's Newsletter RSS Feed
  try {
    const lennyRes = await fetch('https://www.lennysnewsletter.com/feed', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (lennyRes.ok) {
      const xml = await lennyRes.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>[\s\S]*?<\/item>/g)].slice(0, 3);

      for (const item of items) {
        const title = stripHtml(item[1]);
        const link = item[2].trim();
        const publishedAt = item[3] ? new Date(item[3]).toISOString() : now;
        const summary = stripHtml(item[4]).slice(0, 260) || 'Product strategy, growth loops, and consumer insights from world-class operators.';

        newItems.push({
          id: `res-lenny-${Buffer.from(link).toString('base64').slice(0, 12)}`,
          title,
          source: 'Lenny’s Newsletter',
          url: link,
          type: 'article',
          duration_minutes: 10,
          track_id: 'track-business',
          difficulty: 'Intermediate',
          summary,
          takeaway: `Connect product architecture directly with retention loops and customer willingness to pay.`,
          youtube_id: null,
          published_at: publishedAt,
          status: 'available',
          is_fresh: 1,
        });
      }
      console.log(`[Learning Engine] Fetched ${items.length} Lenny’s Newsletter articles.`);
    }
  } catch (err) {
    console.warn('[Learning Engine] Lenny feed check failed:', err.message);
  }

  // Upsert fetched items into SQLite while strictly preserving user notes, saved, and completed!
  const upsertStmt = db.prepare(`
    INSERT INTO learning_resources (
      id, title, source, url, type, duration_minutes, track_id, difficulty,
      summary, takeaway, youtube_id, saved, completed, user_notes, published_at,
      status, is_fresh, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, '', ?, ?, 1, ?)
    ON CONFLICT(url) DO UPDATE SET
      title=excluded.title,
      summary=excluded.summary,
      takeaway=excluded.takeaway,
      youtube_id=excluded.youtube_id,
      published_at=excluded.published_at,
      status=excluded.status,
      is_fresh=1
  `);

  let addedCount = 0;
  for (const item of newItems) {
    try {
      upsertStmt.run(
        item.id,
        item.title,
        item.source,
        item.url,
        item.type,
        item.duration_minutes,
        item.track_id,
        item.difficulty,
        item.summary,
        item.takeaway,
        item.youtube_id || null,
        item.published_at,
        item.status,
        now
      );
      addedCount++;
    } catch (e) {
      console.warn('[Learning Engine] Upsert note:', e.message);
    }
  }

  // Record last refresh time in SQLite
  const updateMeta = db.prepare(`
    INSERT INTO learning_meta (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
  `);
  updateMeta.run('last_refreshed_at', now, now);

  console.log(`[Learning Engine] Refresh complete. Processed ${addedCount} live items. Timestamp: ${now}`);
  return { addedCount, refreshedAt: now };
}

// Initialize seed on startup
seedLearningResources();

// Schedule 24-hour periodic refresh
setInterval(() => {
  refreshLearningContent().catch((err) => console.error('[Learning Engine] Periodic refresh error:', err));
}, 24 * 60 * 60 * 1000);

// Kick off initial background refresh after a short boot delay
setTimeout(() => {
  refreshLearningContent().catch(() => {});
}, 3000);

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 1. Health check
    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        hasOpenAIKey: Boolean(serverOpenAIKey),
        model: selectedOpenAIModel,
        database: 'sqlite_connected',
      });
    }

    // 2. Set API Key & Model
    if (req.method === 'POST' && pathname === '/api/config/key') {
      const { apiKey, model } = await parseJsonBody(req);
      if (apiKey !== undefined) {
        serverOpenAIKey = (apiKey || '').trim();
      }
      if (model) {
        selectedOpenAIModel = model;
      }
      // Save to .env
      const envContent = `OPENAI_API_KEY=${serverOpenAIKey}\nOPENAI_MODEL=${selectedOpenAIModel}\n`;
      fs.writeFileSync(ENV_PATH, envContent, 'utf-8');

      return sendJson(res, 200, {
        ok: true,
        hasOpenAIKey: Boolean(serverOpenAIKey),
        model: selectedOpenAIModel,
      });
    }

    // 3. Real OpenAI ChatGPT Chat Endpoint
    if (req.method === 'POST' && pathname === '/api/chat') {
      const { messages, mode = 'general', contextHint = '', requestFeedback = false } = await parseJsonBody(req);

      if (!serverOpenAIKey) {
        return sendJson(res, 200, {
          ok: false,
          error: 'OPENAI_KEY_REQUIRED',
          message:
            'OpenAI API key is not configured on the server. Please enter your OpenAI API key in Settings to enable real ChatGPT conversations and Whisper voice transcription.',
        });
      }

      // Prepare system prompt based on mode
      let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;
      if (contextHint) {
        systemPrompt += `\n\nCurrent user context/topic: "${contextHint}".`;
      }
      if (requestFeedback) {
        systemPrompt += `\n\nThe user explicitly requested communication feedback on her latest speaking response. Analyze her clarity, structure (Point-Reason-Example), and conciseness, then provide 2-3 actionable suggestions warmly.`;
      }

      const openaiPayload = {
        model: selectedOpenAIModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || []).map((m) => ({
            role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
            content: m.content || m.text || '',
          })),
        ],
        temperature: 0.7,
        max_tokens: 1200,
      };

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverOpenAIKey}`,
        },
        body: JSON.stringify(openaiPayload),
      });

      if (!openaiRes.ok) {
        const errorData = await openaiRes.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        return sendJson(res, 200, {
          ok: false,
          error: 'OPENAI_API_ERROR',
          message: errorData?.error?.message || `OpenAI returned status ${openaiRes.status}`,
        });
      }

      const completion = await openaiRes.json();
      const reply = completion.candidates?.[0]?.content || completion.choices?.[0]?.message?.content || '';

      return sendJson(res, 200, {
        ok: true,
        reply,
        model: completion.model || selectedOpenAIModel,
        usage: completion.usage,
      });
    }

    // 4. Real OpenAI Whisper Audio Transcription Endpoint
    if (req.method === 'POST' && pathname === '/api/transcribe') {
      if (!serverOpenAIKey) {
        return sendJson(res, 200, {
          ok: false,
          error: 'OPENAI_KEY_REQUIRED',
          message: 'OpenAI API key required for Whisper transcription.',
        });
      }

      const rawBuffer = await parseBufferBody(req);
      if (!rawBuffer || rawBuffer.length === 0) {
        return sendJson(res, 400, { error: 'Empty audio payload' });
      }

      // Create multipart form data for Whisper
      const formData = new FormData();
      const audioBlob = new Blob([rawBuffer], { type: req.headers['content-type'] || 'audio/webm' });
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serverOpenAIKey}`,
        },
        body: formData,
      });

      if (!whisperRes.ok) {
        const err = await whisperRes.json().catch(() => ({}));
        console.error('Whisper API Error:', err);
        return sendJson(res, 200, {
          ok: false,
          error: 'WHISPER_ERROR',
          message: err?.error?.message || `Whisper error ${whisperRes.status}`,
        });
      }

      const whisperData = await whisperRes.json();
      return sendJson(res, 200, {
        ok: true,
        text: whisperData.text || '',
      });
    }

    // 5. Conversation History & Persistence (SQLite)
    if (pathname === '/api/conversations') {
      if (req.method === 'GET') {
        const rows = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
        return sendJson(res, 200, { ok: true, conversations: rows });
      }

      if (req.method === 'POST') {
        const { id, title, mode, messages } = await parseJsonBody(req);
        const convId = id || `conv-${Date.now()}`;
        const now = new Date().toISOString();

        // Upsert conversation
        const upsertConv = db.prepare(`
          INSERT INTO conversations (id, title, mode, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET title=excluded.title, mode=excluded.mode, updated_at=excluded.updated_at
        `);
        upsertConv.run(convId, title || 'New Conversation', mode || 'general', now, now);

        // Insert messages
        if (Array.isArray(messages)) {
          const insertMsg = db.prepare(`
            INSERT INTO messages (id, conversation_id, role, content, audio_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET content=excluded.content, audio_url=excluded.audio_url
          `);
          for (const m of messages) {
            insertMsg.run(
              m.id || `msg-${Date.now()}-${Math.random()}`,
              convId,
              m.role || (m.sender === 'user' ? 'user' : 'assistant'),
              m.content || m.text || '',
              m.audioUrl || null,
              m.created_at || now
            );
          }
        }

        return sendJson(res, 200, { ok: true, id: convId });
      }
    }

    // Specific conversation messages
    if (pathname.startsWith('/api/conversations/')) {
      const convId = pathname.replace('/api/conversations/', '').trim();
      if (req.method === 'GET') {
        const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
        const msgs = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(convId);
        return sendJson(res, 200, { ok: true, conversation: conv, messages: msgs });
      }
      if (req.method === 'DELETE') {
        db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(convId);
        db.prepare('DELETE FROM conversations WHERE id = ?').run(convId);
        return sendJson(res, 200, { ok: true });
      }
    }

    // 6. Two-Way Persistent Data Sync (Profile, Canvas, Planner, Notes)
    if (pathname === '/api/sync') {
      if (req.method === 'GET') {
        const rows = db.prepare('SELECT key, value FROM user_state').all();
        const state = {};
        for (const r of rows) {
          try {
            state[r.key] = JSON.parse(r.value);
          } catch (e) {
            state[r.key] = r.value;
          }
        }
        return sendJson(res, 200, { ok: true, state });
      }

      if (req.method === 'POST') {
        const { key, value } = await parseJsonBody(req);
        if (key) {
          const now = new Date().toISOString();
          const upsertState = db.prepare(`
            INSERT INTO user_state (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
          `);
          upsertState.run(key, typeof value === 'string' ? value : JSON.stringify(value), now);
        }
        return sendJson(res, 200, { ok: true });
      }
    }

    // 7. Live Learning Library Endpoints
    if (pathname === '/api/learning/resources' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM learning_resources ORDER BY is_fresh DESC, created_at DESC').all();
      const metaRow = db.prepare("SELECT value FROM learning_meta WHERE key = 'last_refreshed_at'").get();
      const lastRefreshedAt = metaRow ? metaRow.value : new Date().toISOString();

      return sendJson(res, 200, {
        ok: true,
        resources: rows.map((r) => ({
          id: r.id,
          title: r.title,
          source: r.source,
          url: r.url,
          type: r.type,
          durationMinutes: r.duration_minutes,
          trackId: r.track_id,
          difficulty: r.difficulty,
          summary: r.summary,
          takeaway: r.takeaway,
          youtubeId: r.youtube_id || undefined,
          saved: Boolean(r.saved),
          completed: Boolean(r.completed),
          userNotes: r.user_notes || '',
          publishedAt: r.published_at,
          status: r.status,
          isFresh: Boolean(r.is_fresh),
          suggestedAlternativeUrl: r.suggested_alternative_url || '',
          channelTitle: r.channel_title || '',
        })),
        meta: {
          lastRefreshedAt,
          totalCount: rows.length,
          freshCount: rows.filter((r) => r.is_fresh).length,
        },
      });
    }

    if (pathname === '/api/learning/refresh' && req.method === 'POST') {
      const refreshResult = await refreshLearningContent();
      const rows = db.prepare('SELECT * FROM learning_resources ORDER BY is_fresh DESC, created_at DESC').all();
      const metaRow = db.prepare("SELECT value FROM learning_meta WHERE key = 'last_refreshed_at'").get();
      const lastRefreshedAt = metaRow ? metaRow.value : new Date().toISOString();

      return sendJson(res, 200, {
        ok: true,
        refreshResult,
        resources: rows.map((r) => ({
          id: r.id,
          title: r.title,
          source: r.source,
          url: r.url,
          type: r.type,
          durationMinutes: r.duration_minutes,
          trackId: r.track_id,
          difficulty: r.difficulty,
          summary: r.summary,
          takeaway: r.takeaway,
          youtubeId: r.youtube_id || undefined,
          saved: Boolean(r.saved),
          completed: Boolean(r.completed),
          userNotes: r.user_notes || '',
          publishedAt: r.published_at,
          status: r.status,
          isFresh: Boolean(r.is_fresh),
          suggestedAlternativeUrl: r.suggested_alternative_url || '',
          channelTitle: r.channel_title || '',
        })),
        meta: {
          lastRefreshedAt,
          totalCount: rows.length,
          freshCount: rows.filter((r) => r.is_fresh).length,
        },
      });
    }

    if (pathname === '/api/learning/action' && req.method === 'POST') {
      const { id, action, value } = await parseJsonBody(req);
      if (!id || !action) {
        return sendJson(res, 400, { error: 'Missing id or action' });
      }

      if (action === 'save') {
        db.prepare('UPDATE learning_resources SET saved = ? WHERE id = ?').run(value ? 1 : 0, id);
      } else if (action === 'complete') {
        db.prepare('UPDATE learning_resources SET completed = ? WHERE id = ?').run(value ? 1 : 0, id);
      } else if (action === 'note') {
        db.prepare('UPDATE learning_resources SET user_notes = ? WHERE id = ?').run(String(value || ''), id);
      }

      return sendJson(res, 200, { ok: true });
    }

    // 8. Static file serving (SPA support in production)
    if (!pathname.startsWith('/api') && fs.existsSync(DIST_DIR)) {
      const decodedPath = decodeURIComponent(pathname);
      const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
      let filePath = path.join(DIST_DIR, safePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        return fs.createReadStream(filePath).pipe(res);
      }

      // Fallback to index.html for SPA client-side routes
      const indexPath = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        return fs.createReadStream(indexPath).pipe(res);
      }
    }

    // Fallthrough: 404
    sendJson(res, 404, { error: 'Not found', path: pathname });
  } catch (err) {
    console.error('Server Handler Error:', err);
    sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`[Growth Lab Server] Secure backend running on http://localhost:${PORT}`);
});
