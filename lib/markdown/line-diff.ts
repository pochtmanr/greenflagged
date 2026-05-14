// Minimal LCS-based line diff. Returns ordered segments for rendering an
// added / removed / unchanged hunk view. Good enough for the tweak preview —
// we don't need word-level granularity.

export type DiffLine =
  | { kind: "add"; text: string }
  | { kind: "del"; text: string }
  | { kind: "ctx"; text: string };

export function lineDiff(prev: string, next: string): DiffLine[] {
  const a = prev.split("\n");
  const b = next.split("\n");

  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "ctx", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", text: a[i] });
      i++;
    } else {
      out.push({ kind: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    out.push({ kind: "del", text: a[i] });
    i++;
  }
  while (j < m) {
    out.push({ kind: "add", text: b[j] });
    j++;
  }
  return out;
}
