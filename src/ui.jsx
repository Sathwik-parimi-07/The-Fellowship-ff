import React, { useState, useMemo } from "react";
import { X, Music, Sparkles, ChevronDown, BookOpen } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { grad, dkey, daysAgo, fmt, fmtLong, tsToKey, isNew, UPI_ID } from "./lib/helpers";

/* ---------------- atoms ---------------- */
export function Card({ children, className = "", style }) {
  return <div className={`bg-white rounded-2xl border border-violet-100 shadow-sm ${className}`} style={style}>{children}</div>;
}

export function Btn({ children, onClick, kind = "grad", className = "", disabled, as = "button", href, type = "button" }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 text-sm transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none";
  const style = kind === "grad" ? { background: grad.btn, boxShadow: "0 8px 18px -8px rgba(147,51,234,.6)" } : {};
  const cls = kind === "grad"
    ? `${base} text-white hover:brightness-110 ${className}`
    : `${base} bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 ${className}`;
  if (as === "a") return <a href={href} className={cls} style={style}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>{children}</button>;
}

export function Chip({ children, tone = "violet" }) {
  const t = {
    violet: "bg-violet-100 text-violet-700", green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700", gray: "bg-slate-100 text-slate-600",
    pink: "bg-fuchsia-100 text-fuchsia-700",
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${t[tone]}`}>{children}</span>;
}

export function Avatar({ name, size = 36 }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: grad.bubble, fontSize: size * 0.42 }}>
      {name ? name[0].toUpperCase() : "?"}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, sub, tint = "#7c3aed", bg = "#f3eefe" }) {
  return (
    <Card className="p-4 flex items-center gap-3.5">
      <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: bg, color: tint }}>
        <Icon size={21} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-violet-900 leading-tight">{value}</div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        {sub && <div className="text-xs text-fuchsia-600 font-semibold mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

export function SectionH({ title, sub, right }) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h2 className="font-display text-xl font-semibold text-violet-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ icon: Icon = Sparkles, title, sub }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: "#f3eefe", color: "#7c3aed" }}><Icon size={24} /></div>
      <div className="font-display font-semibold text-violet-900">{title}</div>
      {sub && <div className="text-sm text-slate-500 mt-1">{sub}</div>}
    </Card>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-violet-500">
      <span className="w-5 h-5 rounded-full border-2 border-violet-300 animate-spin" style={{ borderTopColor: "#d946ef" }} />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="fade-up text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#31106b,#7c3aed)" }}>
        <Sparkles size={15} /> {msg}
      </div>
    </div>
  );
}

/* Viewer expects: { name, date (YYYY-MM-DD), urls: [..], note } */
export function Viewer({ data, onClose }) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,8,45,.72)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-2xl fade-up overflow-auto" style={{ maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={data.name} size={34} />
            <div>
              <div className="font-bold text-violet-900 text-sm">{data.name}'s QT</div>
              <div className="text-xs text-slate-500">{fmtLong(data.date)} · {data.urls.length} page{data.urls.length > 1 ? "s" : ""}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-violet-50 text-slate-500"><X size={18} /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.urls.map((p, i) => <img key={i} src={p} alt={"page " + (i + 1)} className="w-full rounded-xl border border-violet-100" style={{ background: "#faf8ff" }} />)}
          {!data.urls.length && <p className="text-sm text-slate-400 p-4">Couldn't load the photos — try refreshing.</p>}
        </div>
        {data.note && <p className="mt-3 text-sm text-violet-700 italic">“{data.note}”</p>}
      </div>
    </div>
  );
}

/* ---------------- contribution heatmap · rows: [{qt_date, status}] ---------------- */
export function Heatmap({ rows }) {
  const map = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.qt_date] = r.status === "reviewed" ? 2 : Math.max(m[r.qt_date] || 0, 1); });
    return m;
  }, [rows]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - start.getDay() - 7 * 15);
  const weeks = []; const cur = new Date(start);
  while (cur <= today) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const future = cur > today;
      col.push({ k: dkey(cur), lvl: future ? -1 : map[dkey(cur)] || 0, today: dkey(cur) === dkey(today) });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(col);
  }
  const colors = ["#ede9fe", "#c4b5fd", "#7c3aed"];
  const cell = 13, gap = 3;
  return (
    <div className="overflow-x-auto no-scrollbar pb-1">
      <div style={{ minWidth: weeks.length * (cell + gap) + 36 }}>
        <div className="flex" style={{ marginLeft: 36, gap }}>
          {weeks.map((w, i) => {
            const m = w[0].k.slice(5, 7);
            const prev = i > 0 ? weeks[i - 1][0].k.slice(5, 7) : null;
            const [y, mo, dd] = w[0].k.split("-").map(Number);
            return (
              <div key={i} className="text-violet-400 font-bold" style={{ width: cell, fontSize: 9.5, whiteSpace: "nowrap" }}>
                {m !== prev ? new Date(y, mo - 1, dd).toLocaleDateString("en", { month: "short" }) : ""}
              </div>
            );
          })}
        </div>
        <div className="flex mt-1" style={{ gap }}>
          <div className="flex flex-col" style={{ gap, width: 32 }}>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <div key={i} className="text-violet-400 font-bold flex items-center" style={{ height: cell, fontSize: 9.5 }}>{d}</div>
            ))}
          </div>
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col" style={{ gap }}>
              {w.map((c) => (
                <div key={c.k}
                  title={c.lvl < 0 ? "" : `${fmtLong(c.k)} — ${c.lvl === 2 ? "Reviewed ✓" : c.lvl === 1 ? "Uploaded · pending review" : "No entry"}`}
                  style={{
                    width: cell, height: cell, borderRadius: 3.5,
                    background: c.lvl < 0 ? "transparent" : colors[c.lvl],
                    boxShadow: c.today ? "0 0 0 2px #d946ef" : "none",
                  }} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center flex-wrap mt-3 text-violet-500 font-medium" style={{ fontSize: 11, gap: 14, marginLeft: 36 }}>
          <span className="flex items-center gap-1.5"><i style={{ width: 11, height: 11, borderRadius: 3, background: colors[0], display: "inline-block" }} /> No entry</span>
          <span className="flex items-center gap-1.5"><i style={{ width: 11, height: 11, borderRadius: 3, background: colors[1], display: "inline-block" }} /> Pending review</span>
          <span className="flex items-center gap-1.5"><i style={{ width: 11, height: 11, borderRadius: 3, background: colors[2], display: "inline-block" }} /> Reviewed</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- decorative UPI QR (replace with your real QR image if you like) ---------------- */

export function FakeQR({ size = 172 }) {
  return (
    <img
      src={qrImage}
      alt="UPI QR Code"
      width={size}
      height={size}
      style={{
        borderRadius: 14,
        background: "#fff",
        objectFit: "contain",
      }}
    />
  );
}
/* ---------------- songs accordion · songs: [{id,title,lyrics,created_at}] ---------------- */
export function SongsList({ songs }) {
  const [open, setOpen] = useState(songs.length ? songs[0].id : null);
  return (
    <div className="space-y-3">
      {songs.map((s) => {
        const isOpen = open === s.id;
        const dateKey = tsToKey(s.created_at);
        return (
          <Card key={s.id} className="overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : s.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-violet-50 transition">
              <div className="rounded-xl flex items-center justify-center text-white shrink-0" style={{ width: 40, height: 40, background: grad.bubble }}><Music size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-violet-900 truncate">{s.title}</div>
                <div className="text-xs text-slate-400">Sent {fmtLong(dateKey)}</div>
              </div>
              {isNew(dateKey) && <Chip tone="pink"><Sparkles size={12} /> New</Chip>}
              <ChevronDown size={18} className={`text-violet-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-violet-50">
                <p className="font-display text-violet-800 whitespace-pre-line leading-relaxed" style={{ fontSize: 15 }}>{s.lyrics}</p>
              </div>
            )}
          </Card>
        );
      })}
      {!songs.length && <Empty icon={BookOpen} title="No songs yet" sub="Songs from the admin will appear here." />}
    </div>
  );
}

/* ---------------- giving chart · payments: [{paid_on, amount}] ---------------- */
export function PayChart({ payments, height = 220 }) {
  const data = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const k = daysAgo(29 - i);
    return { d: fmt(k), amt: payments.filter((p) => p.paid_on === k).reduce((s, p) => s + Number(p.amount), 0) };
  }), [payments]);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1edfc" vertical={false} />
          <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8d83b8" }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: "#8d83b8" }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => "₹" + v} />
          <RTooltip formatter={(v) => ["₹" + v, "Gifts"]} contentStyle={{ borderRadius: 12, border: "1px solid #ede9fe", fontSize: 12 }} labelStyle={{ color: "#4c1d95", fontWeight: 700 }} />
          <Area type="monotone" dataKey="amt" stroke="#7c3aed" strokeWidth={2.5} fill="url(#pg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
