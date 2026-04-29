import { NextResponse } from "next/server";
import { isAllowedMediaHost } from "@/lib/media/proxy";
import { decryptUrl } from "@/lib/media/signing";

export const revalidate = 604800;

const SAFE_HEADERS = [
  "content-type",
  "content-length",
  "etag",
  "last-modified",
  "accept-ranges",
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const src = decryptUrl(token);
  if (!src) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }
  if (!isAllowedMediaHost(src)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(src, {
    headers: {
      accept: req.headers.get("accept") ?? "image/*,*/*;q=0.8",
      ...(req.headers.get("range") ? { range: req.headers.get("range") as string } : {}),
    },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "upstream failed", status: upstream.status },
      { status: 502 },
    );
  }

  const headers = new Headers();
  for (const name of SAFE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "public, max-age=86400, s-maxage=2592000, immutable");
  headers.set("x-bff-proxy", "media");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
