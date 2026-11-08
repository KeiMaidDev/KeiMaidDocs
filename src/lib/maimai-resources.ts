export type MaimaiResourceKind = 'icon' | 'plate';

export interface MaimaiResource {
  id: number;
  filename?: string;
  name: string;
  genre: string;
  hint: string;
  requires?: number[];
  remasters?: number[];
}

const kinds = new Set<MaimaiResourceKind>(['icon', 'plate']);

export function isMaimaiResourceKind(value: string): value is MaimaiResourceKind {
  return kinds.has(value as MaimaiResourceKind);
}

export function normalizeCdnBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || requestUrl.host;
  const protocol =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : requestUrl.protocol.replace(':', '');

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
}

export function maimaiDataUrl(baseUrl: string, kind: MaimaiResourceKind) {
  return new URL(`data/maimai/${kind}.json`, `${baseUrl}/`).toString();
}

export function maimaiImageUrl(baseUrl: string, kind: MaimaiResourceKind, id: number) {
  return new URL(`maimai/${kind}/${id}.webp`, `${baseUrl}/`).toString();
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isSafeInteger(item) && item >= 0);
}

function isMaimaiResource(value: unknown): value is MaimaiResource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const resource = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(resource.id) &&
    Number(resource.id) > 0 &&
    typeof resource.name === 'string' &&
    typeof resource.genre === 'string' &&
    typeof resource.hint === 'string' &&
    (resource.filename === undefined || typeof resource.filename === 'string') &&
    (resource.requires === undefined || isNumberArray(resource.requires)) &&
    (resource.remasters === undefined || isNumberArray(resource.remasters))
  );
}

export function parseMaimaiResources(value: unknown): MaimaiResource[] {
  if (!Array.isArray(value)) {
    throw new TypeError('资源数据必须是数组');
  }

  return value.map((item, index) => {
    if (!isMaimaiResource(item)) {
      throw new TypeError(`资源数据第 ${index + 1} 项格式无效`);
    }
    return item;
  });
}

export function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ja-JP');
}

export function includesSearchTokens(resource: MaimaiResource, tokens: string[]) {
  const searchable = normalizeSearchText(
    [String(resource.id), resource.name, resource.genre, resource.hint].join('\n'),
  );
  return tokens.every((token) => searchable.includes(token));
}

export function sortMaimaiGenres(genres: Iterable<string>) {
  return [...new Set(genres)].sort(
    new Intl.Collator('ja-JP', { numeric: true, sensitivity: 'base' }).compare,
  );
}
