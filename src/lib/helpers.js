// ---------- design tokens ----------
export const grad = {
  hero: "linear-gradient(135deg,#6d28d9 0%,#8b5cf6 45%,#c026d3 115%)",
  btn: "linear-gradient(135deg,#7c3aed,#c026d3)",
  side: "linear-gradient(172deg,#1d0f3d 0%,#3b1180 62%,#4c1d95 115%)",
  bubble: "linear-gradient(135deg,#8b5cf6,#d946ef)",
};
export const inputCls =
  "w-full bg-white border border-violet-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition";

export const ROLE_LABEL = {
  member: "Member",
  president: "President",
  prayer_secretary: "Prayer Secretary",
  music_secretary: "Music Secretary",
};

// ---------- dates ----------
export const dkey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dkey(d); };
export const todayKey = () => daysAgo(0);
export const monthKey = () => todayKey().slice(0, 7);
export const tsToKey = (ts) => dkey(new Date(ts));
export const fmt = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
export const fmtLong = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
export const isNew = (k) => { const [y, m, d] = k.split("-").map(Number); return (Date.now() - new Date(y, m - 1, d)) / 864e5 <= 7; };
export const timeAgo = (ts) => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return fmtLong(tsToKey(ts));
};
export const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

// ---------- streak & stats from qt_uploads rows [{qt_date, status}] ----------
export function computeStats(rows) {
  const map = {};
  rows.forEach((r) => { map[r.qt_date] = r.status === "reviewed" ? "r" : map[r.qt_date] || "p"; });
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let cur = 0;
  const d = new Date(t);
  if (map[dkey(d)] !== "r") d.setDate(d.getDate() - 1); // today pending/missing doesn't break the run
  while (map[dkey(d)] === "r") { cur++; d.setDate(d.getDate() - 1); }
  let best = 0, run = 0;
  for (let i = 200; i >= 0; i--) {
    if (map[daysAgo(i)] === "r") { run++; best = Math.max(best, run); } else run = 0;
  }
  return {
    cur, best,
    total: rows.length,
    thisMonth: rows.filter((r) => r.qt_date.startsWith(monthKey())).length,
    today: rows.find((r) => r.qt_date === todayKey()) || null,
  };
}

// ---------- shrink phone photos before upload ----------
export async function shrinkImage(file, maxDim = 1600, quality = 0.82) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    return blob || file;
  } catch {
    return file;
  }
}
