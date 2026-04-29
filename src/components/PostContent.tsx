export function PostContent({ html }: { html: string }) {
  return (
    <div
      className="prose-post max-w-none text-base"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
