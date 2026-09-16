import { createAction, Property } from '@activepieces/pieces-framework';
import { darkmoonAuth, resolveAuth } from '../auth';
import { DarkmoonClient } from '../client';
import { activepiecesTransport } from '../transport';

/** Get Findings — fetch the vulnerabilities and severity stats for a campaign. */
export const getFindings = createAction({
  auth: darkmoonAuth,
  name: 'get_findings',
  displayName: 'Get Findings',
  description: 'Return the vulnerabilities and aggregated severity stats for a Darkmoon campaign.',
  props: {
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: true,
    }),
  },
  async run(context) {
    const { baseUrl, username, password } = resolveAuth(context.auth);
    const client = new DarkmoonClient(baseUrl, activepiecesTransport);
    await client.login(username, password);
    const findings = await client.getFindings(context.propsValue.campaignId);
    return findings;
  },
});
