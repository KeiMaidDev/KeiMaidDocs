import { NotFound } from '@/components/not-found';
import { BookOpen, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <NotFound
        primary={{ href: '/', label: '返回首页', icon: Home }}
        secondary={{ href: '/docs', label: '浏览文档', icon: BookOpen }}
      />
    </main>
  );
}
