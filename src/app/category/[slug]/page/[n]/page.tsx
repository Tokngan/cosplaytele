import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/lib/config";
import { getPostRepository, getTaxonomyRepository } from "@/lib/repositories";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ slug: string; n: string }>;

function parsePageParam(value: string): number | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const n = Number(value);
  if (n < 2) return null;
  return n;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (!page) return { title: "Not found" };

  const term = await getTaxonomyRepository().getCategoryBySlug(slug);
  if (!term) return { title: "Not found" };

  const url = `${siteConfig.url}/category/${term.slug}/page/${page}`;
  return {
    title: `${term.name} — Page ${page}`,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${term.name} — Page ${page}` },
  };
}

export default async function CategoryPagedPage({ params }: { params: Params }) {
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (!page) notFound();

  const term = await getTaxonomyRepository().getCategoryBySlug(slug);
  if (!term) notFound();

  const result = await getPostRepository().list({
    page,
    perPage: siteConfig.defaultPostsPerPage,
    categorySlug: slug,
  });

  if (result.items.length === 0) notFound();

  const hrefForPage = (m: number) =>
    m === 1 ? `/category/${term.slug}` : `/category/${term.slug}/page/${m}`;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm text-muted">Category</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {term.name} <span className="text-muted text-xl">— Page {page}</span>
        </h1>
      </header>
      <section className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post, i) => (
          <PostCard key={post.id} post={post} priority={i < 3} />
        ))}
      </section>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={hrefForPage}
      />
    </>
  );
}
