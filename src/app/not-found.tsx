import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Back home
      </Link>
    </div>
  );
}
