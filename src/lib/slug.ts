export function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Slug de curso no formato "{id}-{nome}", já que Course não tem coluna slug. */
export function courseSlug(course: { id: number; name: string }): string {
  return `${course.id}-${generateSlug(course.name)}`;
}

export function courseIdFromSlug(slug: string): number | null {
  const id = Number.parseInt(slug, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}
