import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CHALLENGES } from '../challenges';
import { TRACK_LABELS, type Track } from '../lib/types';
import { useProgress } from '../lib/progress';

function isTrack(value: string | undefined): value is Track {
  return value === 'basics' || value === 'intermediate' || value === 'advanced';
}

function ChallengeCard({ id }: { id: string }) {
  const challenge = CHALLENGES.find((c) => c.id === id)!;
  const { isDone } = useProgress();
  return (
    <Link to={challenge.path} className="card challenge-card" data-testid={`challenge-card-${challenge.id}`}>
      {isDone(challenge.id) && (
        <span className="done-tick" aria-label="completed">
          ✓
        </span>
      )}
      <h3>{challenge.title}</h3>
      <p className="muted small">{challenge.summary}</p>
      <div>
        {challenge.concepts.slice(0, 4).map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function Home() {
  const { doneCount, total } = useProgress();
  useEffect(() => {
    document.title = 'Playwright Practice Hub';
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Master Playwright by practicing on a real app</h1>
        <p>
          Every page on this site is a deliberately testable challenge. Point your Playwright tests at it, solve the
          task, and level up from your first <code>getByRole</code> to WebSocket mocking, <code>storageState</code>{' '}
          sessions and Page Object architecture. Each challenge lists its concepts, gives progressive hints, and ships
          with a reference solution.
        </p>
        <div className="steps">
          <div className="step">
            <strong>1. Clone &amp; run</strong>
            Run <code>npm run dev</code> — the practice app and its API start together.
          </div>
          <div className="step">
            <strong>2. Write a test</strong>
            Create <code>tests/</code> with <code>npm init playwright</code>, set <code>baseURL</code> to{' '}
            <code>http://localhost:5173</code>.
          </div>
          <div className="step">
            <strong>3. Solve &amp; compare</strong>
            Work through the tracks and compare with the reference tests in <code>examples/</code>.
          </div>
        </div>
      </section>

      <div className="card" data-testid="overall-progress">
        <h2>
          Your progress: {doneCount}/{total} challenges completed
        </h2>
        <div
          className="progressbar-outer"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={doneCount}
        >
          <div className="progressbar-inner" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
        </div>
      </div>

      {(['basics', 'intermediate', 'advanced'] as Track[]).map((track) => (
        <section className="track-section" key={track} aria-label={`${TRACK_LABELS[track]} track`}>
          <div className="track-head">
            <span className={`badge ${track}`}>{TRACK_LABELS[track]}</span>
            <h2>{TRACK_LABELS[track]} track</h2>
            <Link to={`/track/${track}`} className="small">
              view track →
            </Link>
          </div>
          <div className="grid">
            {CHALLENGES.filter((c) => c.track === track).map((c) => (
              <ChallengeCard key={c.id} id={c.id} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function TrackPage() {
  const { track } = useParams();
  const { isDone } = useProgress();
  useEffect(() => {
    if (isTrack(track)) document.title = `${TRACK_LABELS[track]} track — Playwright Practice Hub`;
  }, [track]);

  if (!isTrack(track)) return <p className="error-text">Unknown track.</p>;
  const challenges = CHALLENGES.filter((c) => c.track === track);

  return (
    <>
      <div className="track-head">
        <span className={`badge ${track}`}>{TRACK_LABELS[track]}</span>
        <h1>
          {TRACK_LABELS[track]} track — {challenges.length} challenges
        </h1>
      </div>
      <p className="muted">Work through the challenges in order; each one builds on concepts from the previous.</p>
      <div className="grid">
        {challenges.map((c) => (
          <ChallengeCard key={c.id} id={c.id} />
        ))}
      </div>
      <p className="small muted" style={{ marginTop: '1.5rem' }}>
        {challenges.filter((c) => isDone(c.id)).length === 0
          ? 'No challenges completed in this track yet.'
          : `${challenges.filter((c) => isDone(c.id)).length} of ${challenges.length} completed.`}{' '}
        Done challenges show a ✓. Progress is stored in localStorage — see the{' '}
        <Link to="/advanced/storage">Web Storage</Link> challenge to manipulate it programmatically.
      </p>
    </>
  );
}
