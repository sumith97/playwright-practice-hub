import { NavLink, Link } from 'react-router-dom';
import { useProgress } from '../lib/progress';
import { useChaos } from '../lib/chaos';

export function Header() {
  const { doneCount, total } = useProgress();
  const { enabled, setEnabled } = useChaos();

  return (
    <header className="app-header" data-testid="site-header">
      <div className="inner">
        <Link to="/" className="brand">
          <span className="logo" aria-hidden="true">🎭</span>
          <span>Playwright Practice Hub</span>
        </Link>
        <nav className="app-nav" aria-label="Main navigation" data-testid="main-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/track/basics">Basics</NavLink>
          <NavLink to="/track/intermediate">Intermediate</NavLink>
          <NavLink to="/track/advanced">Advanced</NavLink>
          <NavLink to="/track/expert">Expert</NavLink>
          <NavLink to="/track/real-world">Real World</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/api-docs">API Docs</NavLink>
        </nav>
        <div className="header-tools">
          <label className="chaos-toggle" data-testid="chaos-toggle-label">
            <input
              type="checkbox"
              role="switch"
              data-testid="chaos-toggle"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Chaos mode
          </label>
          <span className="progress-badge" data-testid="progress-badge" aria-label={`Progress: ${doneCount} of ${total} challenges completed`}>
            {doneCount}/{total} done
          </span>
        </div>
      </div>
    </header>
  );
}
