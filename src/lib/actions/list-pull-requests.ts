import { createAction, Property } from '@activepieces/pieces-framework';
import { darkmoonAuth, resolveAuth } from '../auth';
import { DarkmoonClient } from '../client';
import { activepiecesTransport } from '../transport';

/**
 * List Pull Requests — return the fix pull requests Darkmoon's remediation agent
 * prepared, optionally scoped to a campaign and narrowed by state client-side.
 * These are read-only records; the piece never creates or merges a pull request.
 */
export const listPullRequests = createAction({
  auth: darkmoonAuth,
  name: 'list_pull_requests',
  displayName: 'List Pull Requests',
  description: 'Return the fix pull requests Darkmoon prepared for review (read-only).',
  props: {
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Optional. Restrict to one campaign (the only server-side filter the API accepts).',
      required: false,
    }),
    state: Property.StaticMultiSelectDropdown({
      displayName: 'State',
      description: 'Optional client-side filter.',
      required: false,
      options: {
        options: [
          { label: 'Proposed', value: 'proposed' },
          { label: 'Draft', value: 'draft' },
          { label: 'Open', value: 'open' },
          { label: 'Merged', value: 'merged' },
          { label: 'Closed', value: 'closed' },
          { label: 'Error', value: 'error' },
        ],
      },
    }),
  },
  async run(context) {
    const { baseUrl, username, password } = resolveAuth(context.auth);
    const p = context.propsValue;
    const client = new DarkmoonClient(baseUrl, activepiecesTransport);
    await client.login(username, password);
    const prs = await client.listPullRequests(p.campaignId || undefined);
    const filtered = DarkmoonClient.filterPullRequests(prs, {
      state: p.state && p.state.length ? p.state : undefined,
    });
    return { pull_requests: filtered, total: filtered.length };
  },
});
