import type {
  ListPostsParams,
  PaginatedPosts,
  Post,
  Term,
} from "@/lib/domain/types";

export interface PostRepository {
  list(params?: ListPostsParams): Promise<PaginatedPosts>;
  getBySlug(slug: string): Promise<Post | null>;
  listSlugsForBuild(limit?: number): Promise<string[]>;
}

export interface TaxonomyRepository {
  getCategoryBySlug(slug: string): Promise<Term | null>;
  getTagBySlug(slug: string): Promise<Term | null>;
}
