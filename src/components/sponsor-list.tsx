'use client';

import { useEffect, useState } from 'react';

type SponsorState =
  | { status: 'loading'; sponsors: string[] }
  | { status: 'success'; sponsors: string[] }
  | { status: 'error'; sponsors: string[] };

export function SponsorList() {
  const [state, setState] = useState<SponsorState>({
    status: 'loading',
    sponsors: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadSponsors() {
      try {
        const response = await fetch('/api/sponsors', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Sponsor request failed with HTTP ${response.status}.`);

        const payload = (await response.json()) as { sponsors?: unknown };
        if (
          !Array.isArray(payload.sponsors) ||
          !payload.sponsors.every((name): name is string => typeof name === 'string')
        ) {
          throw new Error('Sponsor response has an invalid shape.');
        }

        setState({ status: 'success', sponsors: payload.sponsors });
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: 'error', sponsors: [] });
        }
      }
    }

    void loadSponsors();

    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <p className="not-prose mt-6 text-sm text-fd-muted-foreground" aria-live="polite">
        正在获取赞助者信息…
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <p className="not-prose mt-6 text-sm text-fd-muted-foreground" aria-live="polite">
        赞助者信息暂时无法获取，请稍后再试。
      </p>
    );
  }

  if (state.sponsors.length === 0) return null;

  return (
    <ul className="not-prose mt-6 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
      {state.sponsors.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className="flex items-start gap-2 text-sm text-fd-muted-foreground"
        >
          <span className="mt-2 size-1 shrink-0 rounded-full bg-fd-border" aria-hidden="true" />
          <span className="break-words">{name}</span>
        </li>
      ))}
    </ul>
  );
}