import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (n: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? hrefForPage(page - 1) : null;
  const next = page < totalPages ? hrefForPage(page + 1) : null;

  return (
    <nav className="mt-10 flex items-center justify-between border-t border-border pt-6 text-sm">
      <div>
        {prev ? (
          <Link href={prev} className="hover:underline" rel="prev">
            ← Previous
          </Link>
        ) : (
          <span className="text-muted">← Previous</span>
        )}
      </div>
      <div className="text-muted">
        Page {page} of {totalPages}
      </div>
      <div>
        {next ? (
          <Link href={next} className="hover:underline" rel="next">
            Next →
          </Link>
        ) : (
          <span className="text-muted">Next →</span>
        )}
      </div>
    </nav>
  );
}
