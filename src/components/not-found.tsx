import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Home, type LucideIcon } from 'lucide-react';

interface NotFoundLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NotFoundProps {
  showAvatar?: boolean;
  primary: NotFoundLink;
  secondary: NotFoundLink;
}

export function NotFound({ showAvatar = true, primary, secondary }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <p className="text-6xl font-extrabold leading-none tracking-tight sm:text-7xl">
        <span className="bg-gradient-to-b from-fd-primary to-fd-primary/50 bg-clip-text text-transparent">
          404
        </span>
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">页面不存在</h1>
        <p className="mx-auto max-w-md text-fd-muted-foreground">
          也许换个方向就能找到你想要的东西？
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:opacity-90"
        >
          <primary.icon className="size-4" aria-hidden="true" />
          {primary.label}
        </Link>
        <Link
          href={secondary.href}
          className="inline-flex items-center gap-2 rounded-full border border-fd-border px-6 py-3 font-medium transition-colors hover:bg-fd-muted"
        >
          <secondary.icon className="size-4" aria-hidden="true" />
          {secondary.label}
        </Link>
      </div>
    </div>
  );
}

