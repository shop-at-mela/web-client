#!/usr/bin/env node
/**
 * Local OOM repro / regression test for SSR memory pressure under
 * concurrent deep-pagination requests.
 *
 * Usage:
 *   node server/index.js &                # start the app under test
 *   node scripts/perf-ssr-memory.js \
 *     --url http://localhost:4000 \
 *     --concurrency 40 \
 *     --pages 1-385
 *
 * This does NOT profile the server process's own heap (that requires
 * running the server itself with --expose-gc / an inspector attached).
 * It profiles THIS process's memory while firing the concurrent load,
 * and reports server response latency/size so you can correlate spikes.
 * For server-side heap numbers, run the server with:
 *   node --max-old-space-size=512 --expose-gc server/index.js
 * and watch RSS via `ps` or Render's metrics while this script runs.
 */
const v8 = require('v8');
const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

function parseArgs(argv) {
  const args = { url: 'http://localhost:4000', concurrency: 20, pages: '1-100', intervalMs: 500 };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inlineValue] = argv[i].split('=');
    const takesNext = inlineValue === undefined;
    const value = takesNext ? argv[i + 1] : inlineValue;
    if (flag === '--url') args.url = value;
    if (flag === '--concurrency') args.concurrency = parseInt(value, 10);
    if (flag === '--pages') args.pages = value;
    if (flag === '--interval') args.intervalMs = parseInt(value, 10);
    if (takesNext && flag !== '--pages' && flag !== '--url') i += 1;
    else if (takesNext) i += 1;
  }
  return args;
}

function pageRange(spec) {
  const [start, end] = spec.split('-').map(n => parseInt(n, 10));
  const pages = [];
  for (let p = start; p <= (end || start); p += 1) pages.push(p);
  return pages;
}

function fetchOnce(baseUrl, page) {
  return new Promise((resolve, reject) => {
    const target = new URL(`/s?page=${page}`, baseUrl);
    const lib = target.protocol === 'https:' ? https : http;
    const startedAt = performance.now();
    const req = lib.get(target, res => {
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
      });
      res.on('end', () => {
        resolve({
          page,
          status: res.statusCode,
          bytes,
          ms: performance.now() - startedAt,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error(`timeout on page=${page}`)));
  });
}

// Bounded-concurrency runner so we control burst size precisely,
// mirroring what a crawler fan-out looks like against the server.
async function runWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;
  async function lane() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      try {
        results.push(await worker(items[idx]));
      } catch (e) {
        results.push({ page: items[idx], error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

function snapshotMemory(label) {
  const mem = process.memoryUsage();
  const heap = v8.getHeapStatistics();
  const mb = n => `${(n / 1024 / 1024).toFixed(1)}MB`;
  console.log(
    `[${label}] rss=${mb(mem.rss)} heapUsed=${mb(mem.heapUsed)} heapTotal=${mb(
      mem.heapTotal
    )} external=${mb(mem.external)} heapLimit=${mb(heap.heap_size_limit)}`
  );
  return mem;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pages = pageRange(args.pages);
  console.log(
    `Firing ${pages.length} requests (pages ${args.pages}) at concurrency=${args.concurrency} against ${args.url}`
  );

  const before = snapshotMemory('client:before');

  const timer = setInterval(() => snapshotMemory('client:during'), args.intervalMs);

  const startedAt = performance.now();
  const results = await runWithConcurrency(pages, args.concurrency, page =>
    fetchOnce(args.url, page)
  );
  const totalMs = performance.now() - startedAt;

  clearInterval(timer);
  if (global.gc) global.gc(); // run with --expose-gc for a cleaner "after" reading
  const after = snapshotMemory('client:after');

  const ok = results.filter(r => r.status && r.status < 400);
  const failed = results.filter(r => !r.status || r.status >= 400 || r.error);
  const avgMs = ok.reduce((sum, r) => sum + r.ms, 0) / (ok.length || 1);
  const maxMs = ok.reduce((max, r) => Math.max(max, r.ms), 0);
  const totalBytes = ok.reduce((sum, r) => sum + (r.bytes || 0), 0);

  console.log('\n--- Summary ---');
  console.log(`total wall time: ${(totalMs / 1000).toFixed(2)}s`);
  console.log(`ok=${ok.length} failed=${failed.length}`);
  console.log(`avg response time: ${avgMs.toFixed(0)}ms, max: ${maxMs.toFixed(0)}ms`);
  console.log(`total response bytes: ${(totalBytes / 1024 / 1024).toFixed(2)}MB`);
  console.log(
    `client RSS delta: ${((after.rss - before.rss) / 1024 / 1024).toFixed(1)}MB (this process, not the server)`
  );
  if (failed.length) {
    console.log('\nFailures (first 10):');
    failed.slice(0, 10).forEach(f => console.log(`  page=${f.page} status=${f.status} ${f.error || ''}`));
  }
  console.log(
    '\nCorrelate the "client:during" timestamps above against the SERVER process RSS ' +
      '(Render metrics dashboard, or `ps -o rss -p <pid>` locally) to see the actual OOM signal.'
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
