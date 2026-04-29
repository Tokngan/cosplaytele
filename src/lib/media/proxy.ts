import { upstreamConfig } from "@/lib/config";
import { encryptUrl } from "@/lib/media/signing";

export function toProxyUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  if (originalUrl.startsWith("/api/media")) return originalUrl;
  if (originalUrl.startsWith("data:")) return originalUrl;
  return `/api/media/${encryptUrl(originalUrl)}`;
}

export function isAllowedMediaHost(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return upstreamConfig.mediaAllowlist.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function rewriteUpstreamLinkToInternal(href: string): string {
  try {
    const url = new URL(href, upstreamConfig.siteOrigin);
    const upstreamHost = new URL(upstreamConfig.siteOrigin).hostname;
    if (url.hostname !== upstreamHost) return href;

    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);

    if (segments.length === 0) return "/";
    if (segments[0] === "category" && segments[1]) return `/category/${segments[1]}`;
    if (segments[0] === "tag" && segments[1]) return `/tag/${segments[1]}`;
    if (segments.length === 1) return `/posts/${segments[0]}`;

    return href;
  } catch {
    return href;
  }
}

const IMG_SRC_RE = /(<img\b[^>]*?\bsrc=)(["'])([^"']+)\2/gi;
const IMG_SRCSET_RE = /(<img\b[^>]*?\bsrcset=)(["'])([^"']+)\2/gi;
const ANCHOR_HREF_RE = /(<a\b[^>]*?\bhref=)(["'])([^"']+)\2/gi;

export function rewriteContentHtml(html: string): string {
  let out = html.replace(IMG_SRC_RE, (_m, lead, quote, src) => {
    return `${lead}${quote}${toProxyUrl(src)}${quote}`;
  });

  out = out.replace(IMG_SRCSET_RE, (_m, lead, quote, srcset) => {
    const rewritten = srcset
      .split(",")
      .map((entry: string) => {
        const trimmed = entry.trim();
        const spaceIdx = trimmed.search(/\s/);
        if (spaceIdx === -1) return toProxyUrl(trimmed);
        const url = trimmed.slice(0, spaceIdx);
        const descriptor = trimmed.slice(spaceIdx);
        return `${toProxyUrl(url)}${descriptor}`;
      })
      .join(", ");
    return `${lead}${quote}${rewritten}${quote}`;
  });

  out = out.replace(ANCHOR_HREF_RE, (_m, lead, quote, href) => {
    return `${lead}${quote}${rewriteUpstreamLinkToInternal(href)}${quote}`;
  });

  return out;
}
