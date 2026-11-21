/**
 * The claim link to show for an agent: on the registry this CLI talks to (a
 * local or staging registry hands out polyskill.ai links), with the id and
 * one-time code from the server's link. Falls back to the server's link as-is.
 */
export function claimLinkFor(registry: string, serverClaimUrl: string): string {
  try {
    const params = new URL(serverClaimUrl).searchParams;
    const id = params.get("id");
    const code = params.get("code");
    if (!id || !code) return serverClaimUrl;
    return `${registry.replace(/\/+$/, "")}/claim?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`;
  } catch {
    return serverClaimUrl;
  }
}
