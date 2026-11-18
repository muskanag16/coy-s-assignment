// Tiny JSON-file "database". Good enough for one user and a few hundred rows.
// Everything is kept in memory and written back to disk after each change,
// so swipes and matches survive a server restart / page reload.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'data', 'db.json');

function emptyDb() {
  return { swipes: [], matches: [] };
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    return emptyDb();
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error('db.json is unreadable, starting with an empty one:', err.message);
    return emptyDb();
  }
}

let db = load();

function save() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  // write to a temp file first and then rename it, so if the process dies
  // halfway through we don't end up with a half-written db.json
  const tmpFile = DB_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2));
  fs.renameSync(tmpFile, DB_FILE);
}

export function getSwipedIds() {
  return new Set(db.swipes.map((s) => s.profileId));
}

export function hasSwiped(profileId) {
  return db.swipes.some((s) => s.profileId === profileId);
}

export function addSwipe(profileId, action) {
  db.swipes.push({ profileId, action, createdAt: new Date().toISOString() });
  save();
}

export function addMatch(profileId) {
  const match = { profileId, matchedAt: new Date().toISOString() };
  db.matches.push(match);
  save();
  return match;
}

export function getMatches() {
  return db.matches;
}

export function resetAll() {
  db = emptyDb();
  save();
}
