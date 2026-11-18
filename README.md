# Coy – Discover tab

A swipe-based discovery feature (like Bumble/Tinder) built as a standalone app.
There's a tab bar with a blank **Home** tab and a **Discover** tab where all the work is.

- **Frontend:** React 18 + Vite (mobile-first, plain CSS)
- **Backend:** Node.js + Express
- **Data:** JSON file (`server/data/db.json`), no external DB needed

## Running it

Needs Node 18+.

```bash
npm install      # installs root, server and client deps
npm run dev      # starts API on :4000 and the React app on :5173
```

Open http://localhost:5173.

To run it as one server instead (production build):

```bash
npm run build
npm start        # http://localhost:4000
```

## Features

- 30 seeded profiles (name, age, photo, bio, city/college, interests)
- 10 of them have already liked the user, so matches show up during a demo
  (for example Ananya, Kabir, Sana and Aditya)
- Drag a card left/right on mobile or with the mouse. On desktop you can also use the ✕ / ♥ buttons or the ← / → arrow keys
- Cards tilt while you drag and show a LIKE / NOPE stamp. If you let go before the threshold, the card snaps back
- A profile you've swiped on is never shown again, even after a reload
- "It's a match!" screen when both people liked each other
- A Matches list inside the Discover tab
- An empty state when there's nobody left, with a "Reset demo data" button

## API

| Method | Path       | Description |
|--------|------------|-------------|
| GET    | `/feed`    | Profiles the user hasn't swiped on yet |
| POST   | `/swipe`   | Body: `{ "profileId": "p1", "action": "like" \| "pass" }`. Returns `{ matched: true, match: {...} }` or `{ matched: false }` |
| GET    | `/matches` | Mutual matches, newest first |
| POST   | `/reset`   | Clears all swipes and matches (only for demos) |

`/swipe` returns `400` for a bad action, `404` for an unknown profile and `409` if
the profile was already swiped.

## Privacy: who liked you stays hidden

Who has liked the user is stored in the seed file as `likesYou`, and only the server reads it.

- `toPublicProfile()` in `server/index.js` copies only the fields that are safe to show,
  so `likesYou` is never part of any response.
- `/swipe` gives exactly the same `{ matched: false }` response for a pass and for a like
  that isn't mutual. Watching the network tab tells you nothing.
- A match is created only when the user likes someone who already liked them.

## Project structure

```
server/
  index.js            Express app + routes
  store.js            reads/writes data/db.json
  seed/profiles.json  the 30 mock profiles
client/src/
  App.jsx             tab bar + switching between tabs
  api.js              fetch helpers for the backend
  pages/Home.jsx      blank placeholder
  pages/Discover.jsx  feed, swipe handling, match popup, empty state
  pages/Matches.jsx   list of matches
  components/SwipeCard.jsx    drag gesture + fly-out animation
  components/MatchScreen.jsx  "It's a match!" overlay
  components/TabBar.jsx
```

## Some decisions

- **JSON file over SQLite:** there's one user and a few dozen rows, so a JSON file is the
  simplest thing that persists. The store writes to a temp file and renames it, so a crash
  can't leave a half-written file. `store.js` is the only file that touches storage,
  so switching to SQLite later would only change that file.
- **No animation library:** the drag uses pointer events, which cover mouse and touch with
  the same code, plus a CSS transform. While dragging, the transition is turned off so the
  card follows the finger exactly. On release it's turned back on so the card either flies
  out or snaps back.
- **Optimistic UI:** the card is removed as soon as it flies off. If the request fails,
  it's put back on the stack and a message is shown.
