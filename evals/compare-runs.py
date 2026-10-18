import json, sys

VOLATILE = {"ms", "trace"}


def rows(run, test):
    with open(f"evals/runs/{run}/{test}.jsonl") as handle:
        records = [json.loads(line) for line in handle if line.strip()]
    return sorted(json.dumps({k: v for k, v in r.items() if k not in VOLATILE}, sort_keys=True) for r in records)


base, candidate = sys.argv[1], sys.argv[2]
ok = True
for test in ["t1", "t3", "t4", "t5"]:
    a, b = rows(base, test), rows(candidate, test)
    same = a == b
    ok &= same
    print(f"{test}: base {len(a)} candidate {len(b)} identical={same}")
sys.exit(0 if ok else 1)
