import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/lib/config";
import { getPostRepository, getTaxonomyRepository } from "@/lib/repositories";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;
type SP = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const term = await getTaxonomyRepository().getTagBySlug(slug);
  if (!term) return { title: "Not found" };

  const url = `${siteConfig.url}/tag/${term.slug}`;
  return {
    title: `#${term.name}`,
    description: term.description || `Posts tagged ${term.name}`,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `#${term.name}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const term = await getTaxonomyRepository().getTagBySlug(slug);
  if (!term) notFound();

  const result = await getPostRepository().list({
    page,
    perPage: siteConfig.defaultPostsPerPage,
    tagSlug: slug,
  });

  if (page > 1 && result.items.length === 0) notFound();

  return (
    <>
      <header className="mb-8">
        <p className="text-sm text-muted">Tag</p>
        <h1 className="text-3xl font-semibold tracking-tight">#{term.name}</h1>
      </header>
      <section className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post, i) => (
          <PostCard key={post.id} post={post} priority={i < 3} />
        ))}
      </section>
      <Pagination
        basePath={`/tag/${term.slug}`}
        page={result.page}
        totalPages={result.totalPages}
      />
    </>
  );
}
