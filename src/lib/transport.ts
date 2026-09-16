/**
 * Transport adapter — bridges the dependency-free {@link DarkmoonClient} to the
 * Activepieces HTTP client.
 *
 * The client expects an injected transport that NEVER throws on a non-2xx
 * status (it inspects `statusCode` itself so error messages carry the API's own
 * `detail`). `@activepieces/pieces-common`'s `httpClient` rejects on 4xx/5xx, so
 * we catch that and surface the real status + parsed body instead.
 */
import { httpClient, HttpMethod, HttpError } from '@activepieces/pieces-common';
import type { HttpFn, HttpResponse } from './client';

export interface DarkmoonAuth {
  baseUrl: string;
  username: string;
  password: string;
}

export const activepiecesTransport: HttpFn = async (opts): Promise<HttpResponse> => {
  try {
    const res = await httpClient.sendRequest({
      method: opts.method as HttpMethod,
      url: opts.url,
      headers: opts.headers,
      body: opts.body as Record<string, unknown> | undefined,
    });
    return { statusCode: res.status, body: res.body };
  } catch (err) {
    if (err instanceof HttpError) {
      const resp = err.response as { status?: number; body?: unknown } | undefined;
      return {
        statusCode: resp?.status ?? 0,
        body: resp?.body ?? { detail: err.message },
      };
    }
    throw err;
  }
};
