import { createMDX } from 'fumadocs-mdx/next';
import fs from 'node:fs';
import path from 'node:path';

function loadDevVars() {
  const filename = path.join(process.cwd(), '.dev.vars');
  if (!fs.existsSync(filename)) return;

  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;

    const rawKey = trimmed.slice(0, separator).trim();
    const key = rawKey.startsWith('export ') ? rawKey.slice(7).trim() : rawKey;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// Next 原生不读取 Wrangler 的 .dev.vars；这里在构建和开发启动前补齐本地变量。
loadDevVars();

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ['@takumi-rs/core'],
};

export default withMDX(config);

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
