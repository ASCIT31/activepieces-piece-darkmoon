import { createAction } from '@activepieces/pieces-framework';
import { darkmoonAuth, resolveAuth } from '../auth';
import { DarkmoonClient } from '../client';
import { activepiecesTransport } from '../transport';

/** List Campaigns — return the campaigns visible to the authenticated user. */
export const listCampaigns = createAction({
  auth: darkmoonAuth,
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'Return the Darkmoon campaigns visible to the authenticated dashboard user.',
  props: {},
  async run(context) {
    const { baseUrl, username, password } = resolveAuth(context.auth);
    const client = new DarkmoonClient(baseUrl, activepiecesTransport);
    await client.login(username, password);
    return { campaigns: await client.listCampaigns() };
  },
});
