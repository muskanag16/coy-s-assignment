import { useEffect, useRef, useState } from 'react';
import { getFeed, sendSwipe, resetDemo } from '../api.js';
import SwipeCard from '../components/SwipeCard.jsx';
import MatchScreen from '../components/MatchScreen.jsx';
import Matches from './Matches.jsx';

export default function Discover() {
  const [view, setView] = useState('cards'); // 'cards' | 'matches'
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMatch, setNewMatch] = useState(null);
  const [toast, setToast] = useState('');

  const topCardRef = useRef(null);
  const toastTimer = useRef(null);

  async function loadFeed() {
    setLoading(true);
    setError('');
    try {
      const data = await getFeed();
      setProfiles(data.profiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  // arrow keys for desktop users
  useEffect(() => {
    if (view !== 'cards' || newMatch) return;

    function handleKey(e) {
      if (e.key === 'ArrowRight') topCardRef.current?.swipe('right');
      if (e.key === 'ArrowLeft') topCardRef.current?.swipe('left');
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, newMatch]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1400);
  }

  // called by the card once its fly-out animation has finished
  async function handleSwipe(profile, action) {
    setProfiles((list) => list.filter((p) => p.id !== profile.id));
    showToast(action === 'like' ? `You liked ${profile.name}` : `Passed on ${profile.name}`);

    try {
      const result = await sendSwipe(profile.id, action);
      if (result.matched) {
        setNewMatch(result.match);
      }
    } catch (err) {
      // 409 means the server already has this swipe, so it's fine to drop the card.
      // For anything else, put the card back so the swipe isn't lost.
      if (err.status !== 409) {
        setProfiles((list) => [profile, ...list]);
        showToast("Couldn't save that swipe, try again");
      }
    }
  }

  async function handleReset() {
    await resetDemo();
    loadFeed();
  }

  // only the top two cards are rendered: the current one and the one peeking behind it
  const visibleCards = profiles.slice(0, 2);

  function renderCards() {
    if (loading) {
      return <p className="status-text">Finding people near you...</p>;
    }

    if (error) {
      return (
        <div className="empty">
          <p className="status-text--error">{error}</p>
          <button className="btn btn--primary" onClick={loadFeed}>
            Retry
          </button>
        </div>
      );
    }

    if (profiles.length === 0) {
      return (
        <div className="empty">
          <h2>You're all caught up</h2>
          <p>You've seen everyone for now. Check back later for new people.</p>
          <button className="btn btn--primary" onClick={() => setView('matches')}>
            View your matches
          </button>
          <button className="btn btn--ghost" onClick={handleReset}>
            Reset demo data
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="deck">
          {/* reversed so the first profile is rendered last, i.e. on top */}
          {[...visibleCards].reverse().map((profile) => {
            const isTop = profile.id === visibleCards[0].id;
            return (
              <SwipeCard
                key={profile.id}
                ref={isTop ? topCardRef : null}
                profile={profile}
                isTop={isTop}
                onSwipe={handleSwipe}
              />
            );
          })}
        </div>

        <div className="actions">
          <button
            className="action-btn action-btn--pass"
            aria-label="Pass"
            onClick={() => topCardRef.current?.swipe('left')}
          >
            ✕
          </button>
          <button
            className="action-btn action-btn--like"
            aria-label="Like"
            onClick={() => topCardRef.current?.swipe('right')}
          >
            ♥
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="discover">
      <header className="discover__header">
        <h1>Discover</h1>
        <div className="segmented">
          <button className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}>
            People
          </button>
          <button className={view === 'matches' ? 'is-active' : ''} onClick={() => setView('matches')}>
            Matches
          </button>
        </div>
      </header>

      <section className="discover__body">
        {view === 'cards' ? renderCards() : <Matches onGoSwipe={() => setView('cards')} />}
      </section>

      {toast && <div className="toast">{toast}</div>}

      {newMatch && (
        <MatchScreen
          match={newMatch}
          onClose={() => setNewMatch(null)}
          onViewMatches={() => {
            setNewMatch(null);
            setView('matches');
          }}
        />
      )}
    </div>
  );
}
