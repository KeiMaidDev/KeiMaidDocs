import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';

const AFDIAN_API_URL = 'https://afdian.com/api/open/query-sponsor';
const CACHE_SECONDS = 60 * 60;

declare global {
  interface CloudflareEnv {
    AFDIAN_USER_ID?: string;
    AFDIAN_API_TOKEN?: string;
  }
}

type AfdianSponsor = {
  user?: {
    name?: string;
  };
};

type AfdianSponsorPage = {
  ec: number;
  em?: string;
  data?: {
    total_page?: number;
    list?: AfdianSponsor[];
  };
};

export class AfdianConfigError extends Error {
  constructor() {
    super('Afdian API credentials are not configured.');
    this.name = 'AfdianConfigError';
  }
}

export class AfdianApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AfdianApiError';
  }
}

export function createAfdianSign(token: string, params: string, ts: number, userId: string) {
  return createHash('md5')
    .update(`${token}params${params}ts${ts}user_id${userId}`)
    .digest('hex');
}

async function getCloudflareEnv() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env;
  } catch {
    return undefined;
  }
}

async function getAfdianCredentials() {
  const env = await getCloudflareEnv();
  const userId = env?.AFDIAN_USER_ID?.trim() || process.env.AFDIAN_USER_ID?.trim();
  const token = env?.AFDIAN_API_TOKEN?.trim() || process.env.AFDIAN_API_TOKEN?.trim();

  if (!userId || !token) throw new AfdianConfigError();

  return { userId, token };
}

async function requestSponsorPage(userId: string, token: string, page: number) {
  const params = JSON.stringify({ page });
  const ts = Math.floor(Date.now() / 1000);
  const sign = createAfdianSign(token, params, ts, userId);

  const response = await fetch(AFDIAN_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, params, ts, sign }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new AfdianApiError(`Afdian API request failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as AfdianSponsorPage;

  if (payload.ec !== 200) {
    throw new AfdianApiError(`Afdian API returned error code ${payload.ec}.`);
  }

  return payload.data ?? {};
}

async function fetchAllSponsorNames(userId: string, token: string) {
  const names: string[] = [];
  let page = 1;
  let totalPage = 1;

  do {
    const data = await requestSponsorPage(userId, token, page);
    const list = data.list ?? [];

    for (const sponsor of list) {
      names.push(sponsor.user?.name?.trim() || '匿名赞助者');
    }

    totalPage = Number(data.total_page) || 0;
    if (list.length === 0) break;
    page += 1;
  } while (page <= totalPage);

  return names.sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

const getCachedSponsorNames = unstable_cache(
  fetchAllSponsorNames,
  ['afdian-sponsor-names'],
  {
    revalidate: CACHE_SECONDS,
    tags: ['afdian-sponsor-names'],
  },
);

export async function getAfdianSponsorNames() {
  const { userId, token } = await getAfdianCredentials();
  return getCachedSponsorNames(userId, token);
}