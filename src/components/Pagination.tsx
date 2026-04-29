import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const sep = basePath.includes("?") ? "&" : "?";
  const link = (n: number) => (n === 1 ? basePath : `${basePath}${sep}page=${n}`);

  const prev = page > 1 ? link(page - 1) : null;
  const next = page < totalPages ? link(page + 1) : null;

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
