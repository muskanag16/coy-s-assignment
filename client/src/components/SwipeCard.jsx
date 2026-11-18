import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

// how far (px) you need to drag before letting go counts as a swipe
const SWIPE_THRESHOLD = 110;
const FLY_OUT_MS = 300;

// Pointer events cover mouse and touch with the same code.
// The parent can also trigger a swipe through the ref (for the buttons
// and the arrow keys), and that runs the same fly-out animation.
const SwipeCard = forwardRef(function SwipeCard({ profile, isTop, onSwipe }, ref) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startPoint = useRef(null);
  // a ref and not state, because a quick double click would otherwise
  // run flyOut twice before React re-renders
  const leavingRef = useRef(false);

  function flyOut(direction) {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setDragging(false);

    const distance = window.innerWidth * 1.2;
    setOffset((prev) => ({
      x: direction === 'right' ? distance : -distance,
      y: prev.y + 40,
    }));

    // wait for the CSS transition to finish before telling the parent
    setTimeout(() => {
      onSwipe(profile, direction === 'right' ? 'like' : 'pass');
    }, FLY_OUT_MS);
  }

  useImperativeHandle(ref, () => ({ swipe: flyOut }));

  function handlePointerDown(e) {
    if (!isTop || leavingRef.current) return;
    // keep getting move events even if the pointer leaves the card
    e.currentTarget.setPointerCapture(e.pointerId);
    startPoint.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    setOffset({
      x: e.clientX - startPoint.current.x,
      y: e.clientY - startPoint.current.y,
    });
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);

    if (offset.x > SWIPE_THRESHOLD) {
      flyOut('right');
    } else if (offset.x < -SWIPE_THRESHOLD) {
      flyOut('left');
    } else {
      setOffset({ x: 0, y: 0 }); // not far enough, snap back
    }
  }

  const rotation = offset.x / 15;
  const likeOpacity = Math.min(Math.max(offset.x / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-offset.x / SWIPE_THRESHOLD, 0), 1);

  const style = isTop
    ? {
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        // no transition while dragging, otherwise the card lags behind the finger
        transition: dragging ? 'none' : `transform ${FLY_OUT_MS}ms ease-out`,
      }
    : undefined;

  const place = [profile.college, profile.city].filter(Boolean).join(', ');

  return (
    <div
      className={`card ${isTop ? 'card--top' : 'card--behind'}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img className="card__photo" src={profile.photo} alt={profile.name} draggable={false} />

      <div className="card__stamp card__stamp--like" style={{ opacity: likeOpacity }}>
        LIKE
      </div>
      <div className="card__stamp card__stamp--nope" style={{ opacity: nopeOpacity }}>
        NOPE
      </div>

      <div className="card__info">
        <h2>
          {profile.name}, <span className="card__age">{profile.age}</span>
        </h2>
        <p className="card__place">{place}</p>
        <p className="card__bio">{profile.bio}</p>
        <ul className="card__tags">
          {profile.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export default SwipeCard;
