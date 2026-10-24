// 人工登记的非爱发电赞助者昵称。
export const manualSponsorNames: readonly string[] = [];

export function normalizeSponsorNames(...sources: ReadonlyArray<readonly string[]>) {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const name of sources.flat()) {
    const normalized = name.trim();
    if (!normalized) continue;

    const key = normalized.normalize('NFKC').toLocaleLowerCase('zh-CN');
    if (seen.has(key)) continue;

    seen.add(key);
    names.push(normalized);
  }

  return names.sort((left, right) => left.localeCompare(right, 'zh-CN'));
}