/* eslint-disable @typescript-eslint/camelcase */
import querystring from "querystring";

export function authorizeUrl(clientId: string, state?: string): string {
  const querys = {
    client_id: clientId,
    scope: ["identity.basic"].join(" "),
    state: state,
    // team: process.env.WORKSTATION_ID // うまく機能しない
  };
  return `https://slack.com/oauth/authorize?${querystring.stringify(querys)}`;
}
