import { useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Manual input beyond clicks:

1. Drag one of the ingredient chips onto the pizza drop zone (HTML5 drag & drop).
2. Reorder the "Build pipeline" list with the ▲/▼ buttons (a click-based alternative when drag is impractical).
3. Drag the difficulty slider to exactly 75 — assert its value.
4. Draw on the canvas with the mouse (press, move, release), then click "Analyze drawing" — it reports how many points you drew.`;

const INGREDIENTS = ['Dough ball', 'Mozzarella', 'Basil leaves'];

export default function DragDrop() {
  const [pizza, setPizza] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [pipeline, setPipeline] = useState(['Lint', 'Unit tests', 'E2E tests']);
  const [slider, setSlider] = useState(25);
  const [points, setPoints] = useState(0);
  const drawing = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<{ x: number; y: number }[]>([]);

  const move = (index: number, delta: number) => {
    setPipeline((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="card">
        <h3>HTML5 drag & drop</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          {INGREDIENTS.map((item) => (
            <span
              key={item}
              className="draggable-chip"
              draggable
              data-testid={`ingredient-${item.split(' ')[0].toLowerCase()}`}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', item)}
            >
              {item}
            </span>
          ))}
        </div>
        <div
          className={`drop-target ${over ? 'over' : ''}`}
          data-testid="pizza-zone"
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const item = e.dataTransfer.getData('text/plain');
            if (item && !pizza.includes(item)) setPizza((prev) => [...prev, item]);
          }}
        >
          {pizza.length === 0 ? 'Drop an ingredient here' : pizza.join(' + ')}
        </div>
      </div>

      <div className="card">
        <h3>Click-based reordering</h3>
        <ol style={{ paddingLeft: '1.2rem' }} data-testid="pipeline-list">
          {pipeline.map((step, i) => (
            <li key={step} style={{ marginBottom: '0.35rem' }}>
              <span data-testid={`pipeline-step-${step.split(' ')[0].toLowerCase()}`}>{step}</span>{' '}
              <button type="button" className="btn subtle" style={{ padding: '0.1rem 0.5rem' }} aria-label={`Move ${step} up`} onClick={() => move(i, -1)} disabled={i === 0}>
                ▲
              </button>{' '}
              <button
                type="button"
                className="btn subtle"
                style={{ padding: '0.1rem 0.5rem' }}
                aria-label={`Move ${step} down`}
                onClick={() => move(i, 1)}
                disabled={i === pipeline.length - 1}
              >
                ▼
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>Slider</h3>
        <div className="field">
          <label htmlFor="difficulty">Difficulty</label>
          <input
            id="difficulty"
            type="range"
            min={0}
            max={100}
            step={5}
            value={slider}
            data-testid="difficulty-slider"
            onChange={(e) => setSlider(Number(e.target.value))}
          />
        </div>
        <p>
          Value: <strong data-testid="slider-value">{slider}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Canvas sketchpad</h3>
        <canvas
          ref={canvasRef}
          className="sketch"
          data-testid="sketch-canvas"
          width={340}
          height={160}
          onPointerDown={(e) => {
            drawing.current = true;
            const p = canvasPos(e);
            strokes.current.push(p);
            const ctx = e.currentTarget.getContext('2d');
            ctx?.beginPath();
            ctx?.moveTo(p.x, p.y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const p = canvasPos(e);
            strokes.current.push(p);
            const ctx = e.currentTarget.getContext('2d');
            ctx?.lineTo(p.x, p.y);
            ctx?.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
        />
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.7rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn subtle"
            data-testid="analyze-drawing"
            onClick={() => setPoints(strokes.current.length)}
          >
            Analyze drawing
          </button>
          <span data-testid="points-result">{points > 0 ? `${points} points drawn` : 'Nothing analyzed yet'}</span>
        </div>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'drag-drop',
  track: 'intermediate',
  title: 'Drag & Drop',
  summary: 'HTML5 drag & drop, list reordering, sliders and freehand canvas drawing.',
  concepts: ['dragTo / dragAndDrop', 'manual mouse control', 'slider fill', 'canvas input'],
  task: TASK,
  hints: [
    'HTML5 DnD: page.getByTestId("ingredient-mozzarella").dragTo(page.getByTestId("pizza-zone")). Playwright synthesizes the dragstart/dragover/drop sequence for you.',
    'Sliders accept fill(): page.getByLabel("Difficulty").fill("75") — or use ArrowRight keys after focus for incremental movement.',
    'Canvas has no elements — drive it with raw mouse events: canvas.hover() + page.mouse.down(), several page.mouse.move(...) steps, page.mouse.up(). Then analyze.',
  ],
  solution: `test('drag, reorder, slide, sketch', async ({ page }) => {
  await page.goto('/intermediate/drag-drop');

  await page.getByTestId('ingredient-mozzarella').dragTo(page.getByTestId('pizza-zone'));
  await expect(page.getByTestId('pizza-zone')).toContainText('Mozzarella');

  // move "E2E tests" to the top with buttons
  await page.getByRole('button', { name: 'Move E2E tests up' }).click();
  await page.getByRole('button', { name: 'Move E2E tests up' }).click();
  await expect(page.getByTestId('pipeline-list').locator('li').first()).toContainText('E2E tests');

  await page.getByLabel('Difficulty').fill('75');
  await expect(page.getByTestId('slider-value')).toHaveText('75');

  const canvas = page.getByTestId('sketch-canvas');
  // raw mouse coordinates are viewport-relative — scroll the canvas into view first
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas not visible');
  await page.mouse.move(box.x + 20, box.y + 80);
  await page.mouse.down();
  for (let i = 0; i <= 20; i++) {
    await page.mouse.move(box.x + 20 + i * 10, box.y + 80 + Math.sin(i / 3) * 30);
  }
  await page.mouse.up();

  await page.getByTestId('analyze-drawing').click();
  await expect(page.getByTestId('points-result')).toContainText(/\\d+ points drawn/);
});`,
  example: 'examples/intermediate/drag-drop.spec.ts',
  path: '/intermediate/drag-drop',
};
