'use client';

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, ChevronDown, LoaderCircle, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import {
  includesSearchTokens,
  maimaiImageUrl,
  type MaimaiResource,
  type MaimaiResourceKind,
  normalizeCdnBaseUrl,
  normalizeSearchText,
  parseMaimaiResources,
  sortMaimaiGenres,
} from '@/lib/maimai-resources';

const PAGE_SIZE = 100;
const TOOLTIP_WIDTH = 320;

interface MaimaiResourceBrowserProps {
  kind: MaimaiResourceKind;
}

interface TooltipState {
  resource: MaimaiResource;
  left: number;
  above: boolean;
  top?: number;
  bottom?: number;
}

interface NoticeState {
  type: 'success' | 'error';
  message: string;
}

interface GenreSelectProps {
  genres: string[];
  value: string;
  onChange: (value: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSearchTokens(query: string) {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

function GenreSelect({ genres, value, onChange }: GenreSelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const filterValue = normalizeSearchText(filter);
  const options = useMemo(
    () => ['', ...genres].filter((item) => !filterValue || normalizeSearchText(item || '全部分类').includes(filterValue)),
    [filterValue, genres],
  );

  const selectGenre = (nextValue: string) => {
    onChange(nextValue);
    setFilter('');
    setActiveIndex(0);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setFilter('');
      }}
    >
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-10 w-full justify-between gap-2 rounded-lg bg-fd-background px-3 text-sm font-normal text-fd-foreground hover:bg-fd-accent data-[popup-open]:bg-fd-accent data-[popup-open]:text-fd-accent-foreground',
        )}
      >
        <span className="truncate">{value || '全部分类'}</span>
        <ChevronDown className="size-4 shrink-0 text-fd-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="min-w-72 p-1">
        <label className="relative block">
          <span className="sr-only">搜索分类</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fd-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, options.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === 'Enter' && activeIndex < options.length) {
                event.preventDefault();
                selectGenre(options[activeIndex]);
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder="搜索分类"
            className="h-8 w-full rounded-md border border-fd-border bg-fd-background pl-8 pr-2 text-sm outline-none placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-ring"
          />
        </label>
        <div
          role="listbox"
          aria-label="分类筛选"
          className="fd-scroll-container mt-1 max-h-64 overflow-y-auto"
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.length ? (
            options.map((item) => {
              const selected = item === value;
              return (
                <button
                  key={item || 'all'}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(options.indexOf(item))}
                  onClick={() => selectGenre(item)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    activeIndex === options.indexOf(item) && 'bg-fd-accent',
                    selected ? 'text-fd-primary' : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{item || '全部分类'}</span>
                  {selected ? <Check className="size-3.5 shrink-0 text-fd-primary" aria-hidden="true" /> : null}
                </button>
              );
            })
          ) : (
            <p className="px-2 py-4 text-center text-sm text-fd-muted-foreground">没有匹配的分类</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ResourceTooltip({ tooltip }: { tooltip: TooltipState }) {
  const style: CSSProperties = {
    position: 'fixed',
    left: tooltip.left,
    width: Math.min(TOOLTIP_WIDTH, window.innerWidth - 16),
    zIndex: 80,
    ...(tooltip.above ? { bottom: tooltip.bottom } : { top: tooltip.top }),
  };

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none max-h-[min(24rem,calc(100vh-2rem))] overflow-hidden rounded-lg border border-fd-border bg-fd-popover p-3 text-fd-popover-foreground shadow-xl"
      style={style}
    >
      <p className="text-sm font-semibold leading-5">{tooltip.resource.name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs leading-5">
        <dt className="text-fd-muted-foreground">ID</dt>
        <dd className="font-mono tabular-nums">{tooltip.resource.id}</dd>
        <dt className="text-fd-muted-foreground">分类</dt>
        <dd>{tooltip.resource.genre}</dd>
        <dt className="text-fd-muted-foreground">说明</dt>
        <dd className="break-words">{tooltip.resource.hint}</dd>
      </dl>
    </div>,
    document.body,
  );
}

export function MaimaiResourceBrowser({ kind }: MaimaiResourceBrowserProps) {
  const isIcon = kind === 'icon';
  const kindLabel = isIcon ? '头像' : '牌子';
  const gridMinWidth = isIcon ? '5rem' : '20rem';
  const cardAspectRatio = isIcon ? '1 / 1' : '720 / 116';

  const [resources, setResources] = useState<MaimaiResource[]>([]);
  const [imageBaseUrl, setImageBaseUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [urlReady, setUrlReady] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [mounted, setMounted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const applyLocation = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get('q') ?? '');
      setGenre(params.get('genre') ?? '');
    };

    applyLocation();
    setUrlReady(true);
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      if (genre.trim()) url.searchParams.set('genre', genre);
      else url.searchParams.delete('genre');

      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== current) {
        window.history.pushState(window.history.state, '', next);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [genre, query, urlReady]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');
    setErrorMessage('');
    setImageBaseUrl(null);

    void (async () => {
      try {
        const response = await fetch(`/api/maimai/${kind}`, {
          cache: 'no-cache',
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String(payload.error)
              : `请求失败（${response.status}）`;
          throw new Error(message);
        }

        const responsePayload =
          payload && typeof payload === 'object' && !Array.isArray(payload)
            ? payload
            : null;
        const resourcesPayload =
          responsePayload && 'resources' in responsePayload
            ? responsePayload.resources
            : null;
        const responseBaseUrl =
          responsePayload && 'imageBaseUrl' in responsePayload
            ? normalizeCdnBaseUrl(String(responsePayload.imageBaseUrl))
            : null;

        if (!responseBaseUrl) {
          throw new Error('服务端未返回图片 CDN 配置');
        }

        setImageBaseUrl(responseBaseUrl);
        setResources(parseMaimaiResources(resourcesPayload));
        setLoadState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        setResources([]);
        setErrorMessage(error instanceof Error ? error.message : '资源加载失败');
        setLoadState('error');
      }
    })();

    return () => controller.abort();
  }, [kind, retryCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setTooltip(null);
  }, [genre, query]);

  useEffect(() => {
    if (!tooltip) return;

    const hideTooltip = () => setTooltip(null);
    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);
    return () => {
      window.removeEventListener('scroll', hideTooltip);
      window.removeEventListener('resize', hideTooltip);
    };
  }, [tooltip]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const availableGenres = useMemo(
    () => sortMaimaiGenres(resources.map((resource) => resource.genre)),
    [resources],
  );

  const filteredResources = useMemo(() => {
    const tokens = getSearchTokens(query);
    const normalizedGenre = normalizeSearchText(genre.trim());

    return resources.filter((resource) => {
      if (tokens.length && !includesSearchTokens(resource, tokens)) return false;
      if (
        normalizedGenre &&
        !normalizeSearchText(resource.genre).includes(normalizedGenre)
      ) {
        return false;
      }
      return true;
    });
  }, [genre, query, resources]);

  const visibleResources = filteredResources.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResources.length;
  const hasFilters = Boolean(query.trim() || genre.trim());

  useEffect(() => {
    if (loadState !== 'ready' || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredResources.length));
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredResources.length, hasMore, loadState]);

  const showNotice = useCallback((nextNotice: NoticeState) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(nextNotice);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2200);
  }, []);

  const showTooltip = useCallback((resource: MaimaiResource, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - 16);
    const left = clamp(
      rect.left + rect.width / 2 - width / 2,
      8,
      Math.max(8, window.innerWidth - width - 8),
    );
    const above = rect.top > 220;

    setTooltip({
      resource,
      left,
      above,
      ...(above
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: Math.min(rect.bottom + 8, window.innerHeight - 80) }),
    });
  }, []);

  const copyId = useCallback(
    async (resource: MaimaiResource) => {
      const id = String(resource.id);

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(id);
        } else if (!fallbackCopyText(id)) {
          throw new Error('浏览器不允许复制');
        }

        showNotice({ type: 'success', message: `已复制${kindLabel} ID：${id}` });
      } catch {
        showNotice({ type: 'error', message: '复制失败，请检查浏览器权限' });
      }
    },
    [kindLabel, showNotice],
  );

  const clearFilters = () => {
    setQuery('');
    setGenre('');
  };

  return (
    <section className="not-prose space-y-5" aria-busy={loadState === 'loading'}>
      <div className="rounded-xl border border-fd-border bg-fd-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">搜索{kindLabel}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`搜索${kindLabel} ID、名称、分类或说明`}
              className="h-10 w-full rounded-lg border border-fd-border bg-fd-background pl-9 pr-9 text-sm outline-none transition-shadow placeholder:text-fd-muted-foreground focus-visible:ring-2 focus-visible:ring-fd-ring"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
                aria-label="清空搜索"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>

          {isIcon ? (
            <div className="sm:w-56">
              <span className="sr-only">按分类筛选头像</span>
              <GenreSelect genres={availableGenres} value={genre} onChange={setGenre} />
            </div>
          ) : null}
        </div>

        {!isIcon && availableGenres.length ? (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="按分类筛选牌子">
            <button
              type="button"
              onClick={() => setGenre('')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                genre
                  ? 'border-fd-border hover:bg-fd-accent'
                  : 'border-fd-primary bg-fd-primary text-fd-primary-foreground',
              )}
            >
              全部
            </button>
            {availableGenres.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGenre(item === genre ? '' : item)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  item === genre
                    ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                    : 'border-fd-border hover:bg-fd-accent',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs text-fd-muted-foreground">
          <p aria-live="polite">
            {loadState === 'ready'
              ? `显示 ${visibleResources.length} / ${filteredResources.length}，共 ${resources.length} 个${kindLabel}`
              : loadState === 'loading'
                ? `正在加载${kindLabel}数据…`
                : '资源数据加载失败'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              清除筛选
            </button>
          ) : null}
        </div>
      </div>

      {loadState === 'loading' ? (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${gridMinWidth}), 1fr))` }}
          role="status"
          aria-label={`正在加载${kindLabel}数据`}
        >
          {Array.from({ length: isIcon ? 24 : 6 }, (_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-md border border-fd-border bg-fd-muted"
              style={{ aspectRatio: cardAspectRatio }}
            />
          ))}
        </div>
      ) : loadState === 'error' ? (
        <div className="rounded-xl border border-fd-border bg-fd-muted/30 p-6 text-center">
          <AlertTriangle className="mx-auto size-7 text-fd-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">暂时无法加载{kindLabel}资源</p>
          <p className="mt-1 text-sm text-fd-muted-foreground">{errorMessage}</p>
          <p className="mt-1 text-xs text-fd-muted-foreground">
            请检查 CDN 地址、JSON 路径和网络状态。
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-fd-border px-3 py-2 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            重试
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-fd-border p-10 text-center">
          <p className="font-medium">没有匹配的{kindLabel}</p>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            尝试更短的关键词，或清除分类筛选。
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-md border border-fd-border px-3 py-2 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              清除筛选
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${gridMinWidth}), 1fr))`,
            }}
          >
            {visibleResources.map((resource) => (
              <button
                key={resource.id}
                type="button"
                onMouseEnter={(event) => showTooltip(resource, event.currentTarget)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(event) => showTooltip(resource, event.currentTarget)}
                onBlur={() => setTooltip(null)}
                onClick={() => void copyId(resource)}
                aria-label={`${kindLabel} ID ${resource.id}，${resource.name}，分类 ${resource.genre}。${resource.hint}。点击复制 ID。`}
                className="group min-w-0 rounded-md border border-fd-border bg-fd-muted/40 p-0.5 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-fd-ring"
              >
                <span
                  className="relative block overflow-hidden rounded-[5px] bg-fd-muted"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  {imageBaseUrl ? (
                    <img
                      src={maimaiImageUrl(imageBaseUrl, kind, resource.id)}
                      alt={resource.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="origin"
                      draggable={false}
                      className="size-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.62] group-focus-visible:brightness-[0.62]"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center p-2 text-center text-xs text-fd-muted-foreground">
                      未配置图片 CDN
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex min-h-16 items-center justify-center gap-2 text-sm text-fd-muted-foreground"
              aria-live="polite"
            >
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              正在加载更多{kindLabel}…
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-fd-muted-foreground">
              已加载全部 {filteredResources.length} 个{kindLabel}
            </p>
          )}
        </>
      )}

      {mounted && tooltip ? <ResourceTooltip tooltip={tooltip} /> : null}

      <div
        className={cn(
          'fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm text-white shadow-lg transition-opacity',
          notice ? 'opacity-100' : 'pointer-events-none opacity-0',
          notice?.type === 'error' ? 'bg-red-600' : 'bg-fd-primary',
        )}
        role="status"
        aria-live="polite"
      >
        {notice?.type === 'success' ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4" aria-hidden="true" />
        )}
        {notice?.message}
      </div>
    </section>
  );
}
