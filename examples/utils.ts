import type { APIRequestContext, Page } from '@playwright/test';

export const STANDARD_USER = { email: 'standard@demo.io', password: 'secret123' };
export const ADMIN_USER = { email: 'admin@demo.io', password: 'admin123' };

/** Restore the practice API to its seed state — call in beforeEach when a test depends on server state. */
export async function resetPracticeData(request: APIRequestContext): Promise<void> {
  await request.post('/api/reset');
}

export interface Session {
  token: string;
  user: { email: string; name: string; role: 'user' | 'admin' };
}

export async function loginViaApi(request: APIRequestContext, credentials: { email: string; password: string }): Promise<Session> {
  const response = await request.post('/auth/login', { data: credentials });
  if (!response.ok()) throw new Error(`API login failed with ${response.status()}`);
  return (await response.json()) as Session;
}

/** Inject a JWT session into localStorage before the app boots (storageState-style reuse). */
export async function seedSession(page: Page, session: Session): Promise<void> {
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('pph.token', token);
      localStorage.setItem('pph.user', JSON.stringify(user));
    },
    [session.token, session.user],
  );
}
