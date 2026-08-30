import type { FastifyInstance, FastifyRequest } from 'fastify';
import { store } from './store.js';

export interface AppUser {
  email: string;
  name: string;
  role: 'user' | 'admin';
}

const users: Record<string, { password: string; user: AppUser }> = {
  'standard@demo.io': { password: 'secret123', user: { email: 'standard@demo.io', name: 'Sam Standard', role: 'user' } },
  'admin@demo.io': { password: 'admin123', user: { email: 'admin@demo.io', name: 'Ava Admin', role: 'admin' } },
};

export function findUser(email: string): { user: AppUser; password: string } | undefined {
  return users[email.toLowerCase()];
}

export type AuthedRequest = FastifyRequest & { user: AppUser };

export function requireAuth(_app: FastifyInstance) {
  return async (request: AuthedRequest, reply: any) => {
    try {
      await (request as any).jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized: missing or invalid bearer token' });
    }
  };
}

export function requireRole(_app: FastifyInstance, role: 'admin') {
  return async (request: AuthedRequest, reply: any) => {
    try {
      await (request as any).jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized: missing or invalid bearer token' });
    }
    const user = (request as any).user as AppUser;
    if (user.role !== role) {
      return reply.code(403).send({ error: `Forbidden: ${role} role required (you are "${user.role}")` });
    }
  };
}

export function issueOtp(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  store.otps.set(email.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60_000 });
  return code;
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = store.otps.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  return entry.code === code;
}
