import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const id = process.env.BATON_RUN ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mock = process.env.BATON_MOCK === '1';
const totalInFlight = Number(process.env.BATON_CONCURRENCY ?? 160);
const env: Record<string, string | undefined> = { ...process.env, BATON_RUN: id };
const startedAt = performance.now();
const timings: Record<string, number> = {};

const runSync = (file: string) => {
  console.log(`\n=== ${file}`);
  const t0 = performance.now();
  const r = spawnSync('bun', [file], { stdio: 'inherit', env });
  timings[file] = Math.round(performance.now() - t0);
  if (r.status !== 0) {
    console.log(`${file} exited ${r.status}`);
    process.exit(r.status ?? 1);
  }
};

const runPrefixed = (file: string) =>
  new Promise<number>((done) => {
    const label = file.replace(/^evals\/|\.ts$/g, '');
    const t0 = performance.now();
    const child = spawn('bun', [file], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const relay = (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n')) if (line) console.log(`[${label}] ${line}`);
    };
    child.stdout.on('data', relay);
    child.stderr.on('data', relay);
    child.on('close', (code) => {
      timings[file] = Math.round(performance.now() - t0);
      console.log(`[${label}] exited ${code} after ${(timings[file] / 1000).toFixed(1)}s`);
      done(code ?? 1);
    });
  });

if (!mock) runSync('evals/probe.ts');
const tests = (process.env.BATON_ONLY_TESTS ?? 't1-grounding,t3-verify,t5-safety,t4-e2e').split(',').map((t) => `evals/${t}.ts`);
env.BATON_CONCURRENCY = String(Math.max(1, Math.floor(totalInFlight / tests.length)));
const codes = await Promise.all(tests.map(runPrefixed));
if (codes.some((code) => code !== 0)) {
  console.log(`tests failed: ${tests.filter((_, i) => codes[i] !== 0).join(', ')}`);
  process.exit(1);
}
runSync('evals/report.ts');
const dir = `evals/runs/${id}${mock ? '-mock' : ''}`;
writeFileSync(
  `${dir}/timing.json`,
  `${JSON.stringify({ run: id, wallMs: Math.round(performance.now() - startedAt), stepsMs: timings, totalInFlight, perTestInFlight: Number(env.BATON_CONCURRENCY) }, null, 2)}\n`,
);
console.log(`\nrun ${id} complete: ${dir}/REPORT.md (wall ${((performance.now() - startedAt) / 60000).toFixed(1)} min)`);
