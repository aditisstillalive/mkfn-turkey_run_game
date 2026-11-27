// Best score and best distance, kept in the browser between runs. Storage can be missing or
// blocked (private windows, file:// pages), so every access is guarded.

const KEY = 'gobble-getaway-best-v1';

export function loadBest() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return { score: data?.score | 0, meters: data?.meters | 0, escapes: data?.escapes | 0 };
  } catch {
    return { score: 0, meters: 0, escapes: 0 };
  }
}

export function saveBest(best) {
  try {
    localStorage.setItem(KEY, JSON.stringify(best));
  } catch {
    /* storage unavailable: the best score lasts this session only */
  }
}

export function recordRun(best, result) {
  const next = {
    score: Math.max(best.score, result.score),
    meters: Math.max(best.meters, result.meters),
    escapes: best.escapes + (result.escaped ? 1 : 0),
  };
  return { best: next, newRecord: result.score > best.score };
}
