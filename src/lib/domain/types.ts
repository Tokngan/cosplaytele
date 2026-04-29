export type Term = {
  id: number;
  name: string;
  slug: string;
  taxonomy: "category" | "post_tag";
  count?: number;
  description?: string;
};

export type Media = {
  id: number;
  url: string;
  width: number;
  height: number;
  alt: string;
  mimeType?: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  date: string;
  modified: string;
  canonicalPath: string;
  featuredImage?: Media;
  categories: Term[];
  tags: Term[];
};

export type PaginatedPosts = {
  items: Post[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type ListPostsParams = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
};
