import { useMemo, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Dropdowns come in many flavors:

1. Pick a country in the native select.
2. Pick two or more toppings in the multi-select.
3. Open the custom "Choose framework" dropdown (a div listbox, not a native select) and pick an option.
4. In the typeahead field, type "plan" — after a short debounce, matching suggestions appear. Click "Planet Express" and confirm it fills the field.`;

const COUNTRIES = ['Netherlands', 'Portugal', 'Japan', 'Brazil', 'Canada'];
const TOPPINGS = ['Mushrooms', 'Olives', 'Pineapple', 'Extra cheese', 'Anchovies'];
const FRAMEWORKS = ['Playwright', 'Cypress', 'Selenium', 'WebdriverIO'];
const SUGGESTIONS = [
  'Planet Express',
  'Planetary Society',
  'Planner Pro',
  'Plant Care',
  'Plan B Studios',
];

export default function Dropdowns() {
  const [country, setCountry] = useState('');
  const [toppings, setToppings] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [framework, setFramework] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [picked, setPicked] = useState('');
  const debounceRef = useRef<number | null>(null);

  const filtered = useMemo(
    () => SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const onTypeaheadChange = (value: string) => {
    setQuery(value);
    setPicked('');
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSuggestions(value.trim() ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5) : []);
    }, 400);
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
      <div className="card">
        <h3>Native select</h3>
        <div className="field">
          <label htmlFor="country">Country</label>
          <select id="country" data-testid="country-select" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Choose…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <p className="small">
          Selected: <strong data-testid="country-result">{country || '—'}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Multi-select</h3>
        <div className="field">
          <label htmlFor="toppings">Toppings (Ctrl/Cmd-click for multiple)</label>
          <select
            id="toppings"
            data-testid="toppings-select"
            multiple
            size={5}
            value={toppings}
            onChange={(e) => setToppings(Array.from(e.target.selectedOptions, (o) => o.value))}
          >
            {TOPPINGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <p className="small">
          Picked: <strong data-testid="toppings-result">{toppings.join(', ') || '—'}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Custom dropdown (not a select!)</h3>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn subtle"
            data-testid="framework-dropdown"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {framework ? `Framework: ${framework}` : 'Choose framework ▾'}
          </button>
          {open && (
            <ul
              role="listbox"
              aria-label="Framework options"
              data-testid="framework-listbox"
              className="card"
              style={{ position: 'absolute', zIndex: 30, listStyle: 'none', margin: '0.3rem 0 0', padding: '0.3rem', width: 240, boxShadow: 'var(--shadow)' }}
            >
              {FRAMEWORKS.map((f) => (
                <li key={f} role="option" aria-selected={framework === f}>
                  <button
                    type="button"
                    style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', padding: '0.35rem 0.6rem', borderRadius: 6 }}
                    data-testid={`framework-option-${f.toLowerCase()}`}
                    onClick={() => {
                      setFramework(f);
                      setOpen(false);
                    }}
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Typeahead with debounce</h3>
        <div className="field">
          <label htmlFor="typeahead">Typeahead input</label>
          <input
            id="typeahead"
            type="text"
            data-testid="typeahead-input"
            value={picked || query}
            onChange={(e) => onTypeaheadChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        {suggestions.length > 0 && (
          <ul role="listbox" aria-label="Suggestions" data-testid="suggestion-list" className="card" style={{ listStyle: 'none', padding: '0.3rem', margin: 0 }}>
            {suggestions.map((s) => (
              <li key={s} role="option" aria-selected={false}>
                <button
                  type="button"
                  style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', padding: '0.3rem 0.6rem' }}
                  onClick={() => {
                    setPicked(s);
                    setQuery(s);
                    setSuggestions([]);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="small">
          Final value: <strong data-testid="typeahead-result">{picked || '—'}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Sanity check</h3>
        <p className="small muted">Matching suggestions computed synchronously for "{query || '…'}": {filtered.length}</p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'dropdowns',
  track: 'intermediate',
  title: 'Dropdowns & Typeahead',
  summary: 'Native selects, multi-selects, div-based custom dropdowns and debounced autocomplete widgets.',
  concepts: ['selectOption', 'multi-select', 'custom listbox widgets', 'debounced input', 'pressSequentially'],
  task: TASK,
  hints: [
    'Native select: page.getByLabel("Country").selectOption({ label: "Japan" }). Multi-select accepts an array: selectOption(["Mushrooms", "Olives"]).',
    'Custom dropdowns are just buttons + lists. Click the trigger, then page.getByRole("option", { name: "Playwright" }).click(). Verify aria-expanded={true} on the trigger if you want an extra assertion.',
    'Typeahead: use pressSequentially("plan", { delay: 100 }) to simulate real typing, then wait for the suggestion list and click the option.',
  ],
  solution: `test('all the dropdown flavors', async ({ page }) => {
  await page.goto('/intermediate/dropdowns');

  await page.getByLabel('Country').selectOption({ label: 'Japan' });
  await expect(page.getByTestId('country-result')).toHaveText('Japan');

  await page.getByLabel('Toppings (Ctrl/Cmd-click for multiple)').selectOption(['Mushrooms', 'Olives']);
  await expect(page.getByTestId('toppings-result')).toHaveText('Mushrooms, Olives');

  await page.getByTestId('framework-dropdown').click();
  await expect(page.getByRole('listbox', { name: 'Framework options' })).toBeVisible();
  await page.getByRole('option', { name: 'Playwright' }).click();
  await expect(page.getByTestId('framework-dropdown')).toContainText('Framework: Playwright');

  const typeahead = page.getByTestId('typeahead-input');
  await typeahead.pressSequentially('plan', { delay: 80 });
  const suggestions = page.getByRole('listbox', { name: 'Suggestions' });
  await expect(suggestions.getByRole('option')).toHaveCount(5);
  await suggestions.getByRole('option', { name: 'Planet Express' }).click();
  await expect(page.getByTestId('typeahead-result')).toHaveText('Planet Express');
});`,
  example: 'examples/intermediate/dropdowns.spec.ts',
  path: '/intermediate/dropdowns',
};
