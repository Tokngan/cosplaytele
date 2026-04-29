import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/domain/types";

export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const img = post.featuredImage;
  const aspect = img ? img.width / img.height : 3 / 2;
  return (
    <article className="group flex flex-col">
      <Link
        href={post.canonicalPath}
        className="relative block overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
        style={{ aspectRatio: `${aspect}` }}
      >
        {img ? (
          <Image
            src={img.url}
            alt={img.alt || post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition group-hover:scale-105"
            priority={priority}
          />
        ) : null}
      </Link>
      <div className="mt-3 flex flex-col gap-1">
        <h2 className="text-base font-semibold leading-snug line-clamp-2">
          <Link href={post.canonicalPath} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.categories.length > 0 ? (
          <p className="text-xs text-muted">
            {post.categories.slice(0, 2).map((c, i) => (
              <span key={c.id}>
                {i > 0 ? " · " : ""}
                <Link href={`/category/${c.slug}`} className="hover:underline">
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
