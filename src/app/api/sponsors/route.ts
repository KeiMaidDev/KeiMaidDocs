import {
  AfdianApiError,
  AfdianConfigError,
  getAfdianSponsorNames,
} from '@/lib/afdian';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const sponsors = await getAfdianSponsorNames();

    return Response.json({ sponsors }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof AfdianConfigError) {
      return Response.json(
        { error: 'AFDIAN_NOT_CONFIGURED' },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof AfdianApiError) {
      console.error('[afdian] Sponsor request failed:', error.message);
    } else {
      console.error('[afdian] Unexpected sponsor request error:', error);
    }

    return Response.json(
      { error: 'AFDIAN_UNAVAILABLE' },
      { status: 502, headers: noStoreHeaders },
    );
  }
}