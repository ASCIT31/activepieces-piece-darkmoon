import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DarkmoonClient, DarkmoonError } from '../dist/lib/client.js';

/** Build a mock transport that returns canned responses and records calls. */
function mockTransport(routes) {
  const calls = [];
  const http = async (opts) => {
    calls.push(opts);
    for (const r of routes) {
      if (opts.method === r.method && opts.url.includes(r.match)) {
        return { statusCode: r.status ?? 200, body: r.body };
      }
    }
    return { statusCode: 404, body: { detail: 'no route' } };
  };
  return { http, calls };
}

test('login caches token and later calls send Authorization', async () => {
  const { http, calls } = mockTransport([
    { method: 'POST', match: '/api/v1/auth/login', body: { token: 'jwt-123' } },
    { method: 'GET', match: '/api/v1/campaigns', body: { data: [{ id: 'c1' }], total: 1 } },
  ]);
  const c = new DarkmoonClient('http://darkmoon.internal:8000/', http);
  const token = await c.login('admin', 'pw');
  assert.equal(token, 'jwt-123');
  const campaigns = await c.listCampaigns();
  assert.equal(campaigns.length, 1);
  const listCall = calls.find((x) => x.url.includes('/campaigns'));
  assert.equal(listCall.headers.Authorization, 'Bearer jwt-123');
  // trailing slash on baseUrl must be normalised (no double slash)
  assert.ok(!listCall.url.includes('8000//'));
});

test('login failure raises DarkmoonError with API detail', async () => {
  const { http } = mockTransport([
    { method: 'POST', match: '/auth/login', status: 401, body: { detail: 'bad creds' } },
  ]);
  const c = new DarkmoonClient('http://x:8000', http);
  await assert.rejects(() => c.login('a', 'b'), (e) => e instanceof DarkmoonError && e.message === 'bad creds' && e.statusCode === 401);
});

test('runCampaign returns run handle and getFindings parses stats', async () => {
  const { http } = mockTransport([
    { method: 'POST', match: '/auth/login', body: { token: 't' } },
    { method: 'POST', match: '/run/campaign', body: { run_id: 'r9', pid: 42, command: 'darkmoon ...' } },
    { method: 'GET', match: '/vulnerabilities', body: { data: [{ id: 'v1', severity: 'high' }], total: 1, stats: { by_severity: { high: 1 } } } },
  ]);
  const c = new DarkmoonClient('http://x:8000', http);
  await c.login('a', 'b');
  const handle = await c.runCampaign({ target: 'http://juice.dmlab.local' });
  assert.equal(handle.run_id, 'r9');
  const f = await c.getFindings('c1');
  assert.equal(f.total, 1);
  assert.equal(f.stats.by_severity.high, 1);
});

test('validateRemediation enforces a credential reference', () => {
  assert.throws(() => DarkmoonClient.validateRemediation({ remediate: true }), DarkmoonError);
  assert.doesNotThrow(() => DarkmoonClient.validateRemediation({ remediate: true, credential_id: 'vault-1' }));
  assert.doesNotThrow(() => DarkmoonClient.validateRemediation({ remediate: false }));
});

test('filterPullRequests narrows by state', () => {
  const prs = [{ id: '1', state: 'open' }, { id: '2', state: 'merged' }, { id: '3', state: 'draft' }];
  const out = DarkmoonClient.filterPullRequests(prs, { state: ['open', 'draft'] });
  assert.deepEqual(out.map((p) => p.id), ['1', '3']);
});
