// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

const config = defineCloudflareConfig({
	incrementalCache: r2IncrementalCache,
});

// Cloudflare Workers 构建会执行 pnpm run build，显式指定底层 Next 命令，避免 OpenNext 递归调用自身。
export default {
	...config,
	buildCommand: "next build",
};
