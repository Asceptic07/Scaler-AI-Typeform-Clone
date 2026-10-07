export function getShareUrl(
  slug: string,
  origin = window.location.origin,
): string {
  return `${origin}/to/${encodeURIComponent(slug)}`;
}
