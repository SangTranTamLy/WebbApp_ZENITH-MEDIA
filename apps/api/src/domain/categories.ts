import type { Category } from "@zenith/shared";

/** A hidden ancestor also hides its descendants; malformed cycles fail closed. */
export function categoryIsVisible(id: string, categories: Category[]): boolean {
  const seen = new Set<string>();
  let current: string | null = id;
  while (current) {
    if (seen.has(current)) return false;
    seen.add(current);
    const category = categories.find((item) => item.id === current);
    if (!category?.active) return false;
    current = category.parentId;
  }
  return true;
}
