// Run all five tests in order under one run id, then write REPORT.md.
// bun run evals            -> real run (needs the odds gateway token)
// BATON_MOCK=1 bun run evals -> plumbing check, no network
import { spawnSync } from 'node:child_process';

const id = process.env.BATON_RUN ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const env = { ...process.env, BATON_RUN: id };
const step = (file: string, extra: Record<string, string> = {}) => {
  console.log(`\n=== ${file}`);
  const r = spawnSync('bun', [file], { stdio: 'inherit', env: { ...env, ...extra } });
  if (r.status !== 0) {
    console.log(`${file} exited ${r.status}`);
    process.exit(r.status ?? 1);
  }
};
if (process.env.BATON_MOCK !== '1') step('evals/probe.ts');
step('evals/t1-grounding.ts');
step('evals/t3-verify.ts');
step('evals/t5-safety.ts');
step('evals/t4-e2e.ts');
step('evals/report.ts', {});
console.log(`\nrun ${id} complete: evals/runs/${id}${process.env.BATON_MOCK === '1' ? '-mock' : ''}/REPORT.md`);
