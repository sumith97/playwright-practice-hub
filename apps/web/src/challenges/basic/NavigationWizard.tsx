import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Drive a multi-step wizard that lives on real sub-routes:

1. Go to /basics/navigation-wizard — it redirects to step 1 (assert the URL).
2. Fill in your project name and continue to step 2.
3. Pick a framework and continue to step 3.
4. Finish — you land on the completion route showing your answers.
5. Use the "Go back" button, then the browser back/forward, and note the URLs change.
6. On the completion page, click "Slow redirect to step 1" — a spinner shows for ~1.5s before the navigation. Assert the final URL (waitForURL practice).`;

interface Answers {
  project: string;
  framework: string;
}

export default function NavigationWizard() {
  const [answers, setAnswers] = useState<Answers>({ project: '', framework: '' });

  return (
    <Routes>
      <Route index element={<Navigate to="/basics/navigation-wizard/step/1" replace />} />
      <Route
        path="step/:step"
        element={<WizardStep answers={answers} setAnswers={setAnswers} />}
      />
      <Route path="complete" element={<Complete answers={answers} reset={() => setAnswers({ project: '', framework: '' })} />} />
    </Routes>
  );
}

function WizardStep({ answers, setAnswers }: { answers: Answers; setAnswers: (a: Answers) => void }) {
  const { step } = useParams();
  const stepNum = Number(step);
  const navigate = useNavigate();

  if (![1, 2, 3].includes(stepNum)) return <p className="error-text">Unknown step.</p>;

  const canContinue = stepNum === 1 ? answers.project.trim().length > 0 : stepNum === 2 ? answers.framework !== '' : true;

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <p className="small muted" data-testid="wizard-progress">
        Step {stepNum} of 3
      </p>
      <div className="progressbar-outer" style={{ marginBottom: '1rem' }} role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepNum}>
        <div className="progressbar-inner" style={{ width: `${(stepNum / 3) * 100}%` }} />
      </div>

      {stepNum === 1 && (
        <div className="field">
          <label htmlFor="wiz-project">Project name</label>
          <input
            id="wiz-project"
            type="text"
            data-testid="wizard-project"
            value={answers.project}
            onChange={(e) => setAnswers({ ...answers, project: e.target.value })}
            placeholder="my-awesome-suite"
          />
        </div>
      )}
      {stepNum === 2 && (
        <div className="field">
          <label htmlFor="wiz-framework">Preferred framework</label>
          <select
            id="wiz-framework"
            data-testid="wizard-framework"
            value={answers.framework}
            onChange={(e) => setAnswers({ ...answers, framework: e.target.value })}
          >
            <option value="">Choose…</option>
            <option value="playwright">Playwright</option>
            <option value="cypress">Cypress (we all have a past)</option>
            <option value="selenium">Selenium (veteran)</option>
          </select>
        </div>
      )}
      {stepNum === 3 && (
        <div data-testid="wizard-review">
          <p>
            Project: <strong>{answers.project || '—'}</strong>
          </p>
          <p>
            Framework: <strong>{answers.framework || '—'}</strong>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
        <button type="button" className="btn subtle" data-testid="wizard-back" onClick={() => navigate(-1)}>
          Go back
        </button>
        {stepNum < 3 ? (
          <button
            type="button"
            className="btn"
            data-testid="wizard-next"
            disabled={!canContinue}
            onClick={() => navigate(`/basics/navigation-wizard/step/${stepNum + 1}`)}
          >
            Continue
          </button>
        ) : (
          <button type="button" className="btn" data-testid="wizard-finish" onClick={() => navigate('/basics/navigation-wizard/complete')}>
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

function Complete({ answers, reset }: { answers: Answers; reset: () => void }) {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  const slowRedirect = () => {
    setRedirecting(true);
    window.setTimeout(() => {
      setRedirecting(false);
      navigate('/basics/navigation-wizard/step/1');
    }, 1500);
  };

  return (
    <div className="card" style={{ maxWidth: 520 }} data-testid="wizard-complete">
      <h2 style={{ color: 'var(--green)' }}>✅ Wizard complete</h2>
      <p>
        Project: <strong>{answers.project || '—'}</strong>
      </p>
      <p>
        Framework: <strong>{answers.framework || '—'}</strong>
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn subtle" data-testid="wizard-restart" onClick={reset}>
          Start over
        </button>
        <button type="button" className="btn secondary" data-testid="wizard-slow-redirect" onClick={slowRedirect} disabled={redirecting}>
          {redirecting ? <span className="spinner" data-testid="redirect-spinner" aria-label="Redirecting" /> : 'Slow redirect to step 1'}
        </button>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'navigation-wizard',
  track: 'basics',
  title: 'Navigation Wizard',
  summary: 'Client-side routing, URL redirects, browser history and a slow redirect that needs waitForURL.',
  concepts: ['toHaveURL', 'waitForURL', 'page.goBack()', 'client-side routing', 'redirects'],
  task: TASK,
  hints: [
    'Visiting /basics/navigation-wizard replaces the URL with /basics/navigation-wizard/step/1 — assert with expect(page).toHaveURL(/step\\/1/).',
    'Continue is disabled until step input is valid — combine toBeDisabled with URL assertions as you move through steps.',
    'The slow redirect: after clicking, wait for the destination with await page.waitForURL("**/step/1"). The spinner element has test id redirect-spinner while in flight.',
  ],
  solution: `test('walk through the wizard', async ({ page }) => {
  await page.goto('/basics/navigation-wizard');
  await expect(page).toHaveURL(/navigation-wizard\\/step\\/1/);

  await page.getByLabel('Project name').fill('my-awesome-suite');
  await page.getByTestId('wizard-next').click();
  await expect(page).toHaveURL(/step\\/2/);

  await page.getByLabel('Preferred framework').selectOption('playwright');
  await page.getByTestId('wizard-next').click();
  await expect(page.getByTestId('wizard-review')).toContainText('my-awesome-suite');

  await page.getByTestId('wizard-finish').click();
  await expect(page).toHaveURL(/complete/);
  await expect(page.getByTestId('wizard-complete')).toContainText('Wizard complete');

  // slow redirect with a spinner in between
  await page.getByTestId('wizard-slow-redirect').click();
  await page.waitForURL('**/basics/navigation-wizard/step/1');
  await expect(page).toHaveURL(/step\\/1/);
});`,
  example: 'examples/basic/navigation-wizard.spec.ts',
  path: '/basics/navigation-wizard',
};
