import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChartNoAxesColumnIncreasing, Sparkles, WavesHorizontal } from 'lucide-react';

const features = [
  {
    icon: WavesHorizontal,
    title: '漂流瓶',
    description: '把心事装进瓶子丢进漂流的大海，也捞起来自陌生人的来信。',
  },
  {
    icon: BookOpen,
    title: 'BA 攻略',
    description: '提供蔚蓝档案（Blue Archive）的游戏攻略，助力老师们的作战。',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: '音游查分',
    description: '聚合音游成绩查询，支持大部分主流音游，方便玩家快速查分。',
  },
  {
    icon: Sparkles,
    title: '塔罗牌',
    description: '抽取专属塔罗牌，让神秘的牌面为你指引今天的运势。',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-14 sm:px-6 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex justify-center">
            <div className="relative aspect-square w-64 rounded-full border border-fd-border bg-fd-muted/30 p-2 shadow-sm sm:w-72 lg:w-80">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src="/keimaid.png"
                  alt="Kei_Maid 角色头像"
                  fill
                  priority
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 288px, 256px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-b from-fd-primary to-fd-primary/50 bg-clip-text text-transparent">
                Kei_Maid
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-fd-muted-foreground sm:text-xl">
              高性能娱乐机器人
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs"
                className="rounded-full bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:opacity-90"
              >
                快速开始 →
              </Link>
              <Link
                href="https://github.com/KeiMaidDev"
                rel="noreferrer noopener"
                target="_blank"
                className="rounded-full border border-fd-border px-6 py-3 font-medium transition-colors hover:bg-fd-muted"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-6 sm:pb-20">
        <div className="border-t border-fd-border pt-10 sm:pt-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-left">
                <Icon className="mb-4 size-6 text-fd-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-fd-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
