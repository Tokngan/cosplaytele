import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/lib/config";
import { getPostRepository } from "@/lib/repositories";

export const revalidate = 1800;
export const dynamicParams = true;

type Params = Promise<{ n: string }>;

const homeHref = (n: number) => (n === 1 ? "/" : `/page/${n}`);

function parsePageParam(value: string): number | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const n = Number(value);
  if (n < 2) return null;
  return n;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { n } = await params;
  const page = parsePageParam(n);
  if (!page) return { title: "Not found" };
  const url = `${siteConfig.url}/page/${page}`;
  return {
    title: `Page ${page}`,
    alternates: { canonical: url },
    openGraph: { url, title: `${siteConfig.name} — Page ${page}` },
    robots: { index: true, follow: true },
  };
}

export default async function HomePagedPage({ params }: { params: Params }) {
  const { n } = await params;
  const page = parsePageParam(n);
  if (!page) notFound();

  const result = await getPostRepository().list({
    page,
    perPage: siteConfig.defaultPostsPerPage,
  });

  if (result.items.length === 0) notFound();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {siteConfig.name} <span className="text-muted text-xl">— Page {page}</span>
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
        hrefForPage={homeHref}
      />
    </>
  );
}
