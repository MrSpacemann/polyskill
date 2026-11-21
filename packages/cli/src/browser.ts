import { spawn } from "node:child_process";
import { win32 } from "node:path";

/**
 * How to open a URL on this platform, without a shell. Windows: `cmd /c start`
 * would read the `&` before `code=` as a command separator and open a link
 * without its claim code, so the URL goes to the protocol handler as one argument.
 */
export function browserCommand(url: string, platform: NodeJS.Platform = process.platform): [string, string[]] {
  if (platform === "darwin") return ["open", [url]];
  // Full path: Windows looks for a bare name in the current folder first, where
  // a planted rundll32.exe would run instead.
  if (platform === "win32") {
    const rundll32 = win32.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "rundll32.exe");
    return [rundll32, ["url.dll,FileProtocolHandler", url]];
  }
  return ["xdg-open", [url]];
}

/**
 * Opens an http(s) URL in the default browser. Never throws: when no browser
 * can be opened, the caller has already printed the link to open by hand.
 */
export function openInBrowser(url: string): void {
  if (!/^https?:\/\//.test(url)) return;
  const [cmd, args] = browserCommand(url);
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // the printed link is the fallback
  }
}
