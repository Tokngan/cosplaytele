import { WordPressPostRepository } from "@/lib/repositories/wordpress-post-repository";
import type {
  PostRepository,
  TaxonomyRepository,
} from "@/lib/repositories/post-repository";

type DataSource = "wordpress" | "database";

let cachedRepo: (PostRepository & TaxonomyRepository) | null = null;

function buildRepo(): PostRepository & TaxonomyRepository {
  const source = (process.env.DATA_SOURCE ?? "wordpress") as DataSource;
  switch (source) {
    case "wordpress":
      return new WordPressPostRepository();
    case "database":
      throw new Error(
        "DATA_SOURCE=database is not implemented yet. Add a DatabasePostRepository and wire it here.",
      );
    default: {
      const _exhaustive: never = source;
      throw new Error(`Unknown DATA_SOURCE: ${_exhaustive as string}`);
    }
  }
}

export function getPostRepository(): PostRepository {
  if (!cachedRepo) cachedRepo = buildRepo();
  return cachedRepo;
}

export function getTaxonomyRepository(): TaxonomyRepository {
  if (!cachedRepo) cachedRepo = buildRepo();
  return cachedRepo;
}

export type { PostRepository, TaxonomyRepository };
