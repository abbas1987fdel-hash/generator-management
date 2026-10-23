const arabicNames = new Intl.Collator('ar', { sensitivity: 'base', numeric: true });
export function sortByArabicName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => arabicNames.compare(a.name.trim(), b.name.trim()));
}
