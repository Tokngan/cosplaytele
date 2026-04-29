import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { siteConfig } from "@/lib/config";
import { getPostRepository } from "@/lib/repositories";

export const revalidate = 1800;

const homeHref = (n: number) => (n === 1 ? "/" : `/page/${n}`);

export default async function HomePage() {
  const result = await getPostRepository().list({
    page: 1,
    perPage: siteConfig.defaultPostsPerPage,
  });

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
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={homeHref}
      />
    </>
  );
}
