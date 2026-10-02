import { RESERVED_SLUGS } from "./constants";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}

/** barberia-carlos -> barberia-carlos-2 -> barberia-carlos-3 */
export function nextSlug(slug: string): string {
  const match = /^(.*)-(\d+)$/.exec(slug);
  if (match && match[1]) return `${match[1]}-${Number(match[2]) + 1}`;
  return `${slug}-2`;
}
