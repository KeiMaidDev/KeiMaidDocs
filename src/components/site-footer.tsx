import { siteFooter } from '@/lib/shared';

export function SiteFooter() {
  const copyright = siteFooter.copyrightOwner.trim();
  const icp = siteFooter.icp.trim();

  if (!copyright && !icp) return null;

  return (
    <footer className="mt-auto border-t border-fd-border bg-fd-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-xs text-fd-muted-foreground sm:flex-row sm:px-6">
        {icp ? (
          <a
            href={siteFooter.icpUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-fd-foreground"
          >
            {icp}
          </a>
        ) : null}
        {icp && copyright ? (
          <span className="hidden text-fd-border sm:inline" aria-hidden="true">
            ·
          </span>
        ) : null}
        {copyright ? <span>{copyright}</span> : null}
      </div>
    </footer>
  );
}