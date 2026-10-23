import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const presetBackgrounds = {
  blue: 'rgba(34, 192, 252, 0.25)',
  pink: 'rgba(255, 183, 197, 0.25)',
  green: 'rgba(62, 175, 124, 0.15)',
} as const;

export type VPCardColor = keyof typeof presetBackgrounds | (string & {});

export interface VPCardProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'title' | 'color'> {
  title: string;
  description?: ReactNode;
  desc?: ReactNode;
  icon?: string;
  logo?: string;
  href?: string;
  link?: string;
  color?: VPCardColor;
  background?: string;
  className?: string;
}

function isExternalHref(href: string) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

function hasContent(value: ReactNode) {
  return value !== undefined && value !== null && value !== '';
}

export function VPCard({
  title,
  description,
  desc,
  icon,
  logo,
  href,
  link,
  color,
  background,
  className,
  style,
  target,
  rel,
  ...anchorProps
}: VPCardProps) {
  const resolvedHref = href ?? link;

  if (!resolvedHref) {
    throw new Error('VPCard requires either an `href` or `link` prop.');
  }

  const resolvedIcon = icon ?? logo;
  const resolvedDescription = description ?? desc;
  const resolvedBackground =
    background ??
    (color
      ? presetBackgrounds[color as keyof typeof presetBackgrounds] ?? color
      : undefined);
  const isExternal = isExternalHref(resolvedHref);
  const resolvedTarget = target ?? (isExternal ? '_blank' : undefined);
  const resolvedRel = isExternal ? (rel ?? 'noopener noreferrer') : rel;

  const cardProps = {
    ...anchorProps,
    className: cn(
      'my-4 mx-2 inline-flex max-w-[400px] items-center rounded-lg bg-[var(--vp-card-bg)] p-4 text-inherit no-underline! shadow-[2px_2px_10px_0_var(--vp-card-shadow)] transition-[background-color,box-shadow] duration-300 ease-[ease] hover:bg-[var(--vp-card-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background motion-reduce:transition-none',
      className,
    ),
    style: {
      ...style,
      ...(resolvedBackground ? { backgroundColor: resolvedBackground } : {}),
    },
    target: resolvedTarget,
    rel: resolvedRel,
  };

  const content = (
    <>
      {resolvedIcon ? (
        <img
          className="my-0! me-[1em] size-[3em] shrink-0 rounded-full object-cover"
          src={resolvedIcon}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-[1.1em] font-medium leading-[1.25]">{title}</div>
        {hasContent(resolvedDescription) ? (
          <>
            <hr className="my-[.25em]!" />
            <div className="text-[.9em] leading-[1.5] text-[#888]">{resolvedDescription}</div>
          </>
        ) : null}
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a {...cardProps} href={resolvedHref}>
        {content}
      </a>
    );
  }

  return (
    <Link {...cardProps} href={resolvedHref}>
      {content}
    </Link>
  );
}
