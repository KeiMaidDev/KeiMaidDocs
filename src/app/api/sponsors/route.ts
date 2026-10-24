import {
  AfdianApiError,
  AfdianConfigError,
  getAfdianSponsorNames,
} from '@/lib/afdian';
import { manualSponsorNames, normalizeSponsorNames } from '@/lib/sponsors';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET() {
  const manualSponsors = normalizeSponsorNames(manualSponsorNames);

  try {
    const afdianSponsors = await getAfdianSponsorNames();

    return Response.json(
      { sponsors: normalizeSponsorNames(manualSponsors, afdianSponsors) },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (error instanceof AfdianApiError) {
      console.error('[afdian] Sponsor request failed:', error.message);
    } else if (!(error instanceof AfdianConfigError)) {
      console.error('[afdian] Unexpected sponsor request error:', error);
    }

    if (manualSponsors.length > 0) {
      return Response.json({ sponsors: manualSponsors }, { headers: noStoreHeaders });
    }

    if (error instanceof AfdianConfigError) {
      return Response.json(
        { error: 'AFDIAN_NOT_CONFIGURED' },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return Response.json(
      { error: 'AFDIAN_UNAVAILABLE' },
      { status: 502, headers: noStoreHeaders },
    );
  }
}