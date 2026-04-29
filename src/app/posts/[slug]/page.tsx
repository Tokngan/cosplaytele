import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostContent } from "@/components/PostContent";
import { siteConfig } from "@/lib/config";
import { getPostRepository } from "@/lib/repositories";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const repo = getPostRepository();
  const slugs = await repo.listSlugsForBuild(siteConfig.build.prerenderLatestPosts);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const repo = getPostRepository();
  const post = await repo.getBySlug(slug);
  if (!post) return { title: "Not found" };

  const url = `${siteConfig.url}${post.canonicalPath}`;
  const image = post.featuredImage
    ? [{ url: post.featuredImage.url, width: post.featuredImage.width, height: post.featuredImage.height }]
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: image,
      tags: post.tags.map((t) => t.name),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage.url] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const repo = getPostRepository();
  const post = await repo.getBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: `${siteConfig.url}${post.canonicalPath}`,
    image: post.featuredImage ? [post.featuredImage.url] : undefined,
    articleSection: post.categories.map((c) => c.name),
    keywords: post.tags.map((t) => t.name).join(", "),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };

  return (
    <article className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:underline">Home</Link>
        {post.categories[0] ? (
          <>
            {" / "}
            <Link href={`/category/${post.categories[0].slug}`} className="hover:underline">
              {post.categories[0].name}
            </Link>
          </>
        ) : null}
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-2 text-sm text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </p>

      {post.featuredImage ? (
        <div
          className="mt-6 relative w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
          style={{ aspectRatio: `${post.featuredImage.width} / ${post.featuredImage.height}` }}
        >
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-8">
        <PostContent html={post.contentHtml} />
      </div>

      {post.tags.length > 0 ? (
        <footer className="mt-10 border-t border-border pt-6">
          <h2 className="text-sm font-semibold mb-3">Tags</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {post.tags.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tag/${t.slug}`}
                  className="rounded-full border border-border px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}
