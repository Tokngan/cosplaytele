import { upstreamConfig } from "@/lib/config";
import { decodeEntities, stripHtml } from "@/lib/domain/html";
import type {
  ListPostsParams,
  Media,
  PaginatedPosts,
  Post,
  Term,
} from "@/lib/domain/types";
import { rewriteContentHtml, toProxyUrl } from "@/lib/media/proxy";
import type {
  PostRepository,
  TaxonomyRepository,
} from "@/lib/repositories/post-repository";

type WPRendered = { rendered: string };

type WPEmbeddedMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
  mime_type?: string;
  media_details?: { width?: number; height?: number };
};

type WPEmbeddedTerm = {
  id: number;
  name: string;
  slug: string;
  taxonomy: "category" | "post_tag";
};

type WPPost = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WPRendered;
  excerpt: WPRendered;
  content: WPRendered;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    "wp:featuredmedia"?: WPEmbeddedMedia[];
    "wp:term"?: WPEmbeddedTerm[][];
  };
};

type WPTerm = {
  id: number;
  name: string;
  slug: string;
  count?: number;
  description?: string;
  taxonomy?: string;
};

const POST_FIELDS = [
  "id",
  "slug",
  "date",
  "modified",
  "link",
  "title",
  "excerpt",
  "content",
  "featured_media",
  "categories",
  "tags",
  "_links",
].join(",");

const LIST_FIELDS = [
  "id",
  "slug",
  "date",
  "modified",
  "link",
  "title",
  "excerpt",
  "featured_media",
  "categories",
  "tags",
].join(",");

function buildUrl(path: string, query: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${upstreamConfig.apiBase}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

function pickFeatured(post: WPPost): Media | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media || !media.source_url) return undefined;
  return {
    id: media.id,
    url: toProxyUrl(media.source_url),
    width: media.media_details?.width ?? 1200,
    height: media.media_details?.height ?? 800,
    alt: media.alt_text || "",
    mimeType: media.mime_type,
  };
}

function pickTerms(post: WPPost): { categories: Term[]; tags: Term[] } {
  const groups = post._embedded?.["wp:term"] ?? [];
  const flat = groups.flat();
  return {
    categories: flat
      .filter((t) => t.taxonomy === "category")
      .map((t) => ({ id: t.id, name: decodeEntities(t.name), slug: t.slug, taxonomy: "category" as const })),
    tags: flat
      .filter((t) => t.taxonomy === "post_tag")
      .map((t) => ({ id: t.id, name: decodeEntities(t.name), slug: t.slug, taxonomy: "post_tag" as const })),
  };
}

function normalize(post: WPPost): Post {
  const { categories, tags } = pickTerms(post);
  return {
    id: post.id,
    slug: post.slug,
    title: decodeEntities(stripHtml(post.title.rendered)),
    excerpt: stripHtml(post.excerpt.rendered).slice(0, 280),
    contentHtml: rewriteContentHtml(post.content?.rendered ?? ""),
    date: post.date,
    modified: post.modified,
    canonicalPath: `/posts/${post.slug}`,
    featuredImage: pickFeatured(post),
    categories,
    tags,
  };
}

async function fetchJson<T>(
  url: string,
  init: { tags?: string[]; revalidateSeconds?: number } = {},
): Promise<{ data: T; headers: Headers }> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: {
      revalidate: init.revalidateSeconds ?? 60 * 30,
      tags: init.tags,
    },
  });
  if (!res.ok) {
    throw new Error(`Upstream ${res.status} for ${url}`);
  }
  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}

export class WordPressPostRepository implements PostRepository, TaxonomyRepository {
  async list(params: ListPostsParams = {}): Promise<PaginatedPosts> {
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));

    const categoryId = params.categorySlug
      ? (await this.getCategoryBySlug(params.categorySlug))?.id
      : undefined;
    const tagId = params.tagSlug
      ? (await this.getTagBySlug(params.tagSlug))?.id
      : undefined;

    if (params.categorySlug && !categoryId) {
      return { items: [], page, perPage, total: 0, totalPages: 0 };
    }
    if (params.tagSlug && !tagId) {
      return { items: [], page, perPage, total: 0, totalPages: 0 };
    }

    const url = buildUrl("/posts", {
      page,
      per_page: perPage,
      _embed: "wp:featuredmedia,wp:term",
      _fields: `${LIST_FIELDS},_embedded,_links`,
      categories: categoryId,
      tags: tagId,
      search: params.search,
      orderby: "date",
      order: "desc",
    });

    const tags = ["posts", `posts:list`];
    if (params.categorySlug) tags.push(`category:${params.categorySlug}`);
    if (params.tagSlug) tags.push(`tag:${params.tagSlug}`);

    const { data, headers } = await fetchJson<WPPost[]>(url, { tags });

    return {
      items: data.map(normalize),
      page,
      perPage,
      total: Number(headers.get("x-wp-total") ?? data.length),
      totalPages: Number(headers.get("x-wp-totalpages") ?? 1),
    };
  }

  async getBySlug(slug: string): Promise<Post | null> {
    const url = buildUrl("/posts", {
      slug,
      _embed: "wp:featuredmedia,wp:term",
      _fields: `${POST_FIELDS},_embedded`,
    });
    const { data } = await fetchJson<WPPost[]>(url, {
      tags: ["posts", `post:${slug}`],
      revalidateSeconds: 60 * 60,
    });
    if (!data.length) return null;
    return normalize(data[0]);
  }

  async listSlugsForBuild(limit = 60): Promise<string[]> {
    const perPage = Math.min(100, limit);
    const url = buildUrl("/posts", {
      per_page: perPage,
      _fields: "slug",
      orderby: "date",
      order: "desc",
    });
    const { data } = await fetchJson<{ slug: string }[]>(url, {
      revalidateSeconds: 60 * 60,
    });
    return data.map((p) => p.slug);
  }

  async getCategoryBySlug(slug: string): Promise<Term | null> {
    const url = buildUrl("/categories", {
      slug,
      _fields: "id,name,slug,count,description",
    });
    const { data } = await fetchJson<WPTerm[]>(url, {
      tags: ["taxonomy", `category:${slug}`],
      revalidateSeconds: 60 * 60 * 6,
    });
    if (!data.length) return null;
    const t = data[0];
    return {
      id: t.id,
      name: decodeEntities(t.name),
      slug: t.slug,
      taxonomy: "category",
      count: t.count,
      description: t.description,
    };
  }

  async getTagBySlug(slug: string): Promise<Term | null> {
    const url = buildUrl("/tags", {
      slug,
      _fields: "id,name,slug,count,description",
    });
    const { data } = await fetchJson<WPTerm[]>(url, {
      tags: ["taxonomy", `tag:${slug}`],
      revalidateSeconds: 60 * 60 * 6,
    });
    if (!data.length) return null;
    const t = data[0];
    return {
      id: t.id,
      name: decodeEntities(t.name),
      slug: t.slug,
      taxonomy: "post_tag",
      count: t.count,
      description: t.description,
    };
  }
}
