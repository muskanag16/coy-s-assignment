export default function MatchScreen({ match, onClose, onViewMatches }) {
  return (
    <div className="match-screen" role="dialog" aria-modal="true">
      <h1 className="match-screen__title">It's a match!</h1>
      <p className="match-screen__text">You and {match.name} liked each other.</p>

      <div className="match-screen__avatars">
        <div className="avatar avatar--me">You</div>
        <img className="avatar" src={match.photo} alt={match.name} />
      </div>

      <button className="btn btn--primary" onClick={onViewMatches}>
        See your matches
      </button>
      <button className="btn btn--ghost" onClick={onClose}>
        Keep swiping
      </button>
    </div>
  );
}
