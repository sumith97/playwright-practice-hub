import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Header } from './layout/Header';
import { Home, TrackPage } from './pages/Home';
import { ApiDocs } from './pages/ApiDocs';
import { ChallengeLayout } from './layout/ChallengeLayout';
import { CHALLENGES } from './challenges';
import { ChaosProvider } from './lib/chaos';
import { ProgressProvider } from './lib/progress';
import { ToastProvider } from './lib/toast';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 480, margin: '3rem auto', textAlign: 'center' }}>
      <h1>404</h1>
      <p className="muted">This page does not exist — a nice URL assertion to practice, though.</p>
      <p>
        <Link to="/" className="btn">
          Back to the dashboard
        </Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ChaosProvider>
      <ProgressProvider>
        <ToastProvider>
          <ScrollToTop />
          <Header />
          <main id="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/track/:track" element={<TrackPage />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              {CHALLENGES.map((challenge) => (
                <Route
                  key={challenge.id}
                  // sub-route hosts (wizard, shop) mount their own inner <Routes>
                  path={challenge.path === '/basics/navigation-wizard' || challenge.path === '/shop' ? `${challenge.path}/*` : challenge.path}
                  element={<ChallengeLayout meta={challenge} />}
                />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="site-footer">
            Playwright Practice Hub — a deliberately testable app for Test Automation Engineers. Challenges stay solvable
            because every one ships with a reference test that runs in CI.
          </footer>
        </ToastProvider>
      </ProgressProvider>
    </ChaosProvider>
  );
}
