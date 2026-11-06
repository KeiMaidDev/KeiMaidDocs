import { NextResponse } from 'next/server';
import {
  isMaimaiResourceKind,
  maimaiDataUrl,
  normalizeCdnBaseUrl,
  parseMaimaiResources,
} from '@/lib/maimai-resources';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  if (!isMaimaiResourceKind(kind)) {
    return NextResponse.json({ error: '未知的舞萌资源类型' }, { status: 404 });
  }

  const baseUrl = normalizeCdnBaseUrl(process.env.NEXT_PUBLIC_MAIMAI_CDN_BASE_URL);
  if (!baseUrl) {
    return NextResponse.json(
      { error: '未配置 NEXT_PUBLIC_MAIMAI_CDN_BASE_URL' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(maimaiDataUrl(baseUrl, kind), {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`CDN returned ${response.status}`);
    }

    const resources = parseMaimaiResources(await response.json());
    return NextResponse.json({
      resources,
      imageBaseUrl: baseUrl,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[maimai] Failed to load resource data', error);
    return NextResponse.json({ error: '舞萌资源数据暂时不可用' }, { status: 502 });
  }
}
