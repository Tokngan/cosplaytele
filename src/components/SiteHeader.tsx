import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
        </nav>
      </div>
    </header>
  );
}
