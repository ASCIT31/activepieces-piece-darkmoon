import { createPiece } from '@activepieces/pieces-framework';
import { darkmoonAuth } from './lib/auth';
import { runPentest } from './lib/actions/run-pentest';
import { getFindings } from './lib/actions/get-findings';
import { listCampaigns } from './lib/actions/list-campaigns';
import { listPullRequests } from './lib/actions/list-pull-requests';

/**
 * Darkmoon — Activepieces community piece.
 *
 * Wire a self-hosted Darkmoon autonomous AI pentest into Activepieces flows:
 * trigger an assessment against a target you are authorised to test, pull back
 * the findings, and review the fix pull requests Darkmoon prepares. The piece is
 * read-plus-trigger only — it never merges a pull request, and it runs entirely
 * against your own Darkmoon instance (the LLM never sees real IPs, hosts or
 * credentials thanks to Darkmoon's privacy gateway).
 */
export const darkmoon = createPiece({
  displayName: 'Darkmoon',
  description:
    'Autonomous AI penetration testing: trigger a scan against an authorised target, pull findings, and review the fix pull requests it prepares.',
  auth: darkmoonAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://github.com/ASCIT31.png',
  categories: [],
  authors: ['ASCIT31'],
  actions: [runPentest, getFindings, listCampaigns, listPullRequests],
  triggers: [],
});
