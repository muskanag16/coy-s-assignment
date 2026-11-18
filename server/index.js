import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as store from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// Seed profiles. These never change at runtime, only the swipes/matches do.
const profiles = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seed', 'profiles.json'), 'utf-8')
);

// `likesYou` lives in the seed file but must NEVER be sent to the browser.
// Otherwise anyone could open dev tools and see who liked them.
// So we only pick the fields that are safe to show.
function toPublicProfile(profile) {
  const { id, name, age, photo, bio, city, college, interests } = profile;
  return { id, name, age, photo, bio, city, college, interests };
}

function findProfile(id) {
  return profiles.find((p) => p.id === id);
}

const app = express();
app.use(express.json());

// GET /feed -> profiles the user hasn't swiped on yet
app.get('/feed', (req, res) => {
  const swiped = store.getSwipedIds();
  const feed = profiles.filter((p) => !swiped.has(p.id)).map(toPublicProfile);
  res.json({ profiles: feed });
});

// POST /swipe { profileId, action: "like" | "pass" }
app.post('/swipe', (req, res) => {
  const { profileId, action } = req.body || {};

  if (action !== 'like' && action !== 'pass') {
    return res.status(400).json({ error: 'action must be "like" or "pass"' });
  }

  const profile = findProfile(profileId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // a profile can only be swiped once
  if (store.hasSwiped(profileId)) {
    return res.status(409).json({ error: 'You already swiped on this profile' });
  }

  store.addSwipe(profileId, action);

  // It's a match only if we liked them AND they had already liked us.
  // For a pass, or a like that isn't returned, the response looks exactly
  // the same, so the client can't tell whether that person liked us.
  if (action === 'like' && profile.likesYou) {
    const match = store.addMatch(profileId);
    return res.json({
      matched: true,
      match: { ...toPublicProfile(profile), matchedAt: match.matchedAt },
    });
  }

  res.json({ matched: false });
});

// GET /matches -> mutual matches, newest first
app.get('/matches', (req, res) => {
  const matches = store
    .getMatches()
    .map((m) => {
      const profile = findProfile(m.profileId);
      return profile ? { ...toPublicProfile(profile), matchedAt: m.matchedAt } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt));

  res.json({ matches });
});

// Only here to make demos easier: wipes all swipes and matches.
app.post('/reset', (req, res) => {
  store.resetAll();
  res.json({ ok: true });
});

// If the client has been built (npm run build), serve it from here too,
// so the whole thing can run on a single port.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
