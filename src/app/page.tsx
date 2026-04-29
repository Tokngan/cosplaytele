import { notFound } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { siteConfig } from "@/lib/config";
import { getPostRepository } from "@/lib/repositories";

export const revalidate = 1800;

type SP = Promise<{ page?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const repo = getPostRepository();
  const result = await repo.list({ page, perPage: siteConfig.defaultPostsPerPage });

  if (page > 1 && result.items.length === 0) notFound();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="mt-2 text-muted">{siteConfig.description}</p>
      </header>
      <section className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post, i) => (
          <PostCard key={post.id} post={post} priority={i < 3} />
        ))}
      </section>
      <Pagination basePath="/" page={result.page} totalPages={result.totalPages} />
    </>
  );
}
