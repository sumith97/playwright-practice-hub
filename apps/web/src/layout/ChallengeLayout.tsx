import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ChallengeMeta } from '../lib/types';
import { TRACK_LABELS } from '../lib/types';
import { useProgress } from '../lib/progress';

interface Props {
  meta: ChallengeMeta;
}

/**
 * Shared template for every challenge page: task brief, progressive hints,
 * reference solution and a completion toggle, followed by the interactive
 * playground itself.
 */
export function ChallengeLayout({ meta }: Props) {
  const { isDone, toggle } = useProgress();
  const done = isDone(meta.id);

  useEffect(() => {
    document.title = `${meta.title} — Playwright Practice Hub`;
    return () => {
      document.title = 'Playwright Practice Hub';
    };
  }, [meta.title]);

  return (
    <article data-testid={`challenge-${meta.id}`}>
      <p className="breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/track/${meta.track}`}>{TRACK_LABELS[meta.track]}</Link> /{' '}
        <span aria-current="page">{meta.title}</span>
      </p>
      <div className="challenge-head">
        <h1>{meta.title}</h1>
        <span className={`badge ${meta.track}`}>{TRACK_LABELS[meta.track]}</span>
      </div>
      <div>
        {meta.concepts.map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>

      <section className="panel task-panel" aria-label="Your task" data-testid="task-panel">
        <h2>🎯 Your task</h2>
        <p className="task-text">{meta.task}</p>
      </section>

      {meta.hints.length > 0 && (
        <section className="panel" aria-label="Hints">
          <h2>💡 Hints</h2>
          {meta.hints.map((hint, i) => (
            <details className="hint" key={i}>
              <summary>Hint {i + 1}</summary>
              <p>{hint}</p>
            </details>
          ))}
        </section>
      )}

      <section className="panel" aria-label="Reference solution">
        <h2>✅ Reference solution</h2>
        <details className="solution">
          <summary>Reveal solution &amp; reference test</summary>
          <pre>
            <code>{meta.solution}</code>
          </pre>
          <p className="small muted">
            Runnable reference test: <code>{meta.example}</code> (in the repo's <code>examples/</code> directory).
          </p>
        </details>
      </section>

      <button
        type="button"
        className={`btn ${done ? 'secondary' : ''}`}
        aria-pressed={done}
        data-testid="mark-complete"
        onClick={() => toggle(meta.id)}
      >
        {done ? '✓ Completed — click to unmark' : 'Mark challenge as complete'}
      </button>

      <section className="playground" aria-label="Playground" data-testid="playground">
        <h2>🧪 Playground</h2>
        <meta.component />
      </section>
    </article>
  );
}
