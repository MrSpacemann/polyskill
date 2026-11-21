import { spawn } from "node:child_process";

/**
 * Opens an http(s) URL in the default browser. Never throws: when no browser
 * can be opened, the caller has already printed the link to open by hand.
 */
export function openInBrowser(url: string): void {
  if (!/^https?:\/\//.test(url)) return;
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args as string[], { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // printed link is the fallback
  }
}
