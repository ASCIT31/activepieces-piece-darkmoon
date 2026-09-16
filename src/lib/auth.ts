import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { DarkmoonClient } from './client';
import { activepiecesTransport } from './transport';

export interface DarkmoonAuthValue {
  baseUrl: string;
  username: string;
  password: string;
}

/**
 * Normalise the custom-auth value. Depending on the framework version,
 * `context.auth` for a CustomAuth is either the flat props object or a
 * `{ type, props }` connection wrapper — this returns the flat credentials
 * either way so actions never break on the shape.
 */
export function resolveAuth(auth: unknown): DarkmoonAuthValue {
  const a = auth as Record<string, unknown> | null;
  const p = (a && typeof a === 'object' && 'props' in a ? a['props'] : a) as
    | Record<string, string>
    | null;
  if (!p) {
    throw new Error('Darkmoon connection is missing.');
  }
  return { baseUrl: p['baseUrl'], username: p['username'], password: p['password'] };
}

/**
 * Darkmoon Dashboard API auth.
 *
 * Darkmoon issues a short-lived JWT from POST /api/v1/auth/login, so a static
 * token cannot be stored — the piece logs in at run time using these fields.
 * `validate` hits the real login endpoint so a wrong URL or credentials fail
 * fast when the connection is created.
 */
export const darkmoonAuth = PieceAuth.CustomAuth({
  description:
    'Connect to your self-hosted Darkmoon Dashboard API (the FastAPI service, typically on port 8000).',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Base URL of the Darkmoon Dashboard API, e.g. http://darkmoon.internal:8000',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Dashboard user.',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Dashboard password.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new DarkmoonClient(auth.baseUrl, activepiecesTransport);
      await client.login(auth.username, auth.password);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
  },
});
