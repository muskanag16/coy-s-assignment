import { useEffect, useState } from 'react';
import { getMatches } from '../api.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function Matches({ onGoSwipe }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMatches()
      .then((data) => setMatches(data.matches))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="status-text">Loading matches...</p>;
  }

  if (error) {
    return <p className="status-text status-text--error">{error}</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="empty">
        <h2>No matches yet</h2>
        <p>When someone you like likes you back, they'll show up here.</p>
        <button className="btn btn--primary" onClick={onGoSwipe}>
          Start swiping
        </button>
      </div>
    );
  }

  return (
    <ul className="match-list">
      {matches.map((m) => (
        <li key={m.id} className="match-list__item">
          <img src={m.photo} alt={m.name} />
          <div>
            <strong>
              {m.name}, {m.age}
            </strong>
            <span>{m.college || m.city}</span>
          </div>
          <time dateTime={m.matchedAt}>{formatDate(m.matchedAt)}</time>
        </li>
      ))}
    </ul>
  );
}
