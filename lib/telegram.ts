import { absoluteUrl } from "./seo";

const USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/;

export function parseTelegramUsername(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let candidate = raw;

  const tgMatch = raw.match(/domain=([a-zA-Z0-9_]+)/i);
  if (tgMatch) {
    candidate = tgMatch[1];
  } else if (/t(?:elegram)?\.me\//i.test(raw) || /^https?:\/\//i.test(raw)) {
    const afterHost = raw.replace(/^https?:\/\//i, "").replace(/^[^/]*\//, "");
    candidate = afterHost.split(/[/?#]/)[0] ?? "";
  }

  candidate = candidate.replace(/^@/, "");

  if (candidate.startsWith("+") || /^joinchat$/i.test(candidate)) return null;

  return USERNAME_RE.test(candidate) ? candidate : null;
}

export function telegramUrl(username: string): string {
  return `https://t.me/${username.replace(/^@/, "")}`;
}

export function buildTelegramUrl(
  username: string,
  opts?: { productName?: string; productId?: string; greeting?: string },
): string {
  const base = telegramUrl(username);
  if (!opts?.productName) return base;
  const lines = [
    opts.greeting ?? "",
    "",
    opts.productName,
    opts.productId ? absoluteUrl(`/product/${opts.productId}`) : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `${base}?text=${encodeURIComponent(lines)}`;
}
