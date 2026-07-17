import React, { useState, useRef } from "react";
import {
  Flame, TrendingUp, BookOpen, CalendarDays, Music, HeartHandshake, ArrowRight,
  ImagePlus, X, Send, CheckCircle2, Clock, Eye, Search, IndianRupee, EyeOff,
  Copy, Check, Sparkles, PenLine, Heart,
} from "lucide-react";
import { grad, inputCls, fmtLong, tsToKey, todayKey, monthName, UPI_ID, computeStats } from "./lib/helpers";
import { Card, Btn, Chip, Avatar, Stat, SectionH, Empty, Heatmap, FakeQR, SongsList } from "./ui";
import * as api from "./lib/api";

/* ---------------- HOME ---------------- */
export function HomeM({ profile, rows, songs, letter, go }) {
  const stats = computeStats(rows);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const latest = songs[0];
  const t = stats.today;
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white" style={{ background: grad.hero }}>
        <div className="absolute rounded-full" style={{ width: 260, height: 260, right: -70, top: -90, background: "rgba(255,255,255,.12)", filter: "blur(2px)" }} />
        <div className="absolute rounded-full" style={{ width: 170, height: 170, right: 60, bottom: -100, background: "rgba(255,255,255,.09)" }} />
        <div className="relative">
          <p className="text-sm font-semibold" style={{ color: "#f3e8ff" }}>{greet},</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-0.5">{profile.name} 🌿</h1>
          <p className="font-display italic mt-3 max-w-md" style={{ color: "#f5edff", fontSize: 15 }}>
            “Thy word is a lamp unto my feet, and a light unto my path.”
            <span className="not-italic text-xs font-semibold" style={{ color: "#e9d5ff", fontFamily: "inherit" }}> — Psalm 119:105</span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1.5 text-sm font-bold"><Flame size={15} /> {stats.cur}-day streak</span>
            <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1.5 text-sm font-bold"><CalendarDays size={15} /> {stats.thisMonth} QTs this month</span>
            {t
              ? <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3.5 py-1.5 text-sm font-bold">{t.status === "reviewed" ? <><CheckCircle2 size={15} /> Today reviewed</> : <><Clock size={15} /> Today pending review</>}</span>
              : <button onClick={() => go("qt")} className="inline-flex items-center gap-1.5 bg-white text-violet-800 rounded-full px-4 py-1.5 text-sm font-bold hover:bg-violet-50 transition active:scale-95">Upload today's QT <ArrowRight size={15} /></button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={Flame} label="Current streak" value={`${stats.cur} days`} tint="#ea580c" bg="#ffedd5" sub={t && t.status !== "reviewed" ? "today counts once reviewed" : null} />
        <Stat icon={TrendingUp} label="Best streak" value={`${stats.best} days`} />
        <Stat icon={BookOpen} label="Total QT pages" value={stats.total} tint="#c026d3" bg="#fae8ff" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="rounded-xl flex items-center justify-center text-white shrink-0" style={{ width: 42, height: 42, background: grad.bubble }}><Music size={19} /></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fuchsia-600 uppercase tracking-wide">Latest song</div>
              <div className="font-display font-semibold text-violet-900 truncate">{latest ? latest.title : "Coming soon"}</div>
            </div>
          </div>
          {latest && <p className="text-sm text-slate-500 italic mt-3">{latest.lyrics.split("\n")[0]}…</p>}
          <div className="mt-4"><Btn kind="ghost" onClick={() => go("songs")}>Open songbook <ArrowRight size={15} /></Btn></div>
        </Card>
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="rounded-xl flex items-center justify-center text-white shrink-0" style={{ width: 42, height: 42, background: grad.bubble }}><HeartHandshake size={19} /></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fuchsia-600 uppercase tracking-wide">Prayer letter</div>
              <div className="font-display font-semibold text-violet-900 truncate">{letter ? `${monthName} letter is out` : "Coming soon"}</div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">Read this month's letter and send your own prayer or praise point to your mentor.</p>
          <div className="mt-4"><Btn kind="ghost" onClick={() => go("prayer")}>Read & pray <ArrowRight size={15} /></Btn></div>
        </Card>
      </div>
    </>
  );
}

/* ---------------- UPLOAD QT ---------------- */
export function UploadQT({ profile, rows, refresh, say, openViewer }) {
  const stats = computeStats(rows);
  const [sel, setSel] = useState([]); // [{file, url}]
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const t = stats.today;

  const onFiles = (e) => {
    const files = [...e.target.files].slice(0, 2 - sel.length);
    setSel((s) => [...s, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))].slice(0, 2));
    e.target.value = "";
  };
  const remove = (i) => { URL.revokeObjectURL(sel[i].url); setSel(sel.filter((_, ix) => ix !== i)); };
  const submit = async () => {
    setBusy(true);
    try {
      await api.uploadQT(profile.id, sel.map((s) => s.file), note.trim());
      sel.forEach((s) => URL.revokeObjectURL(s.url));
      setSel([]); setNote("");
      say("QT uploaded — sent to your mentor for review");
      refresh();
    } catch (e) { say(e.message || "Upload failed — try again"); }
    setBusy(false);
  };
  const recent = rows.slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Flame} label="Current streak" value={stats.cur} tint="#ea580c" bg="#ffedd5" />
        <Stat icon={TrendingUp} label="Best streak" value={stats.best} />
        <Stat icon={CalendarDays} label="This month" value={stats.thisMonth} tint="#c026d3" bg="#fae8ff" />
        <Stat icon={BookOpen} label="All time" value={stats.total} tint="#4f46e5" bg="#e0e7ff" />
      </div>

      {!t ? (
        <Card className="p-5">
          <SectionH title="Today's QT" sub="Photograph today's page (1–2 pages) and send it to your mentor." />
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {sel.map((p, i) => (
              <div key={i} className="relative">
                <img src={p.url} alt={"page " + (i + 1)} className="w-full h-44 object-cover rounded-xl border border-violet-100" style={{ background: "#faf8ff" }} />
                <button onClick={() => remove(i)} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow text-slate-600 hover:text-red-500"><X size={14} /></button>
                <span className="absolute bottom-2 left-2"><Chip>Page {i + 1}</Chip></span>
              </div>
            ))}
            {sel.length < 2 && (
              <button onClick={() => fileRef.current && fileRef.current.click()}
                className="h-44 rounded-xl border-2 border-dashed border-violet-300 text-violet-500 hover:border-fuchsia-400 hover:text-fuchsia-600 hover:bg-violet-50 transition flex flex-col items-center justify-center gap-2">
                <ImagePlus size={26} />
                <span className="text-sm font-semibold">{sel.length === 0 ? "Add page photo" : "Add 2nd page"}</span>
                <span className="text-xs text-slate-400">JPG / PNG · compressed automatically</span>
              </button>
            )}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="A line about today's passage (optional)" className={inputCls + " mt-4"} />
          <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
            <p className="text-xs text-slate-400">Your streak grows when your mentor marks it reviewed.</p>
            <Btn disabled={sel.length === 0 || busy} onClick={submit}>
              <Send size={15} /> {busy ? "Uploading…" : "Submit for review"}
            </Btn>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SectionH title="Today's QT is in ✓" sub={t.status === "reviewed" ? "Reviewed by your mentor — streak updated!" : "Waiting for your mentor's review."} />
            {t.status === "reviewed" ? <Chip tone="green"><CheckCircle2 size={13} /> Reviewed</Chip> : <Chip tone="amber"><Clock size={13} /> Pending</Chip>}
          </div>
          <div className="flex gap-3 mt-4">
            {(t.pageUrls || []).map((p, i) => (
              <img key={i} src={p} alt={"page " + (i + 1)} onClick={() => openViewer({ name: profile.name, date: t.qt_date, urls: t.pageUrls || [], note: t.note })}
                className="w-24 h-32 object-cover rounded-xl border border-violet-100 cursor-pointer hover:opacity-90" style={{ background: "#faf8ff" }} />
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionH title="Your consistency" sub="One square per day — the garden you're growing." right={<Chip tone="pink"><Flame size={13} /> {stats.cur}-day streak</Chip>} />
        <div className="mt-4"><Heatmap rows={rows} /></div>
      </Card>

      <Card className="p-5">
        <SectionH title="Recent uploads" />
        <div className="mt-3 divide-y divide-violet-50">
          {recent.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              {u.pageUrls && u.pageUrls[0]
                ? <img src={u.pageUrls[0]} alt="" className="w-9 h-12 object-cover rounded-md border border-violet-100" style={{ background: "#faf8ff" }} />
                : <div className="w-9 h-12 rounded-md border border-violet-100 flex items-center justify-center text-violet-300"><BookOpen size={15} /></div>}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-violet-900">{fmtLong(u.qt_date)}</div>
                <div className="text-xs text-slate-400">{u.pages.length} page{u.pages.length > 1 ? "s" : ""}{u.note ? " · " + u.note : ""}</div>
              </div>
              {u.status === "reviewed" ? <Chip tone="green"><CheckCircle2 size={13} /> Reviewed</Chip> : <Chip tone="amber"><Clock size={13} /> Pending</Chip>}
              {u.pageUrls && u.pageUrls.length > 0 && (
                <button onClick={() => openViewer({ name: profile.name, date: u.qt_date, urls: u.pageUrls, note: u.note })} className="p-2 rounded-lg text-violet-500 hover:bg-violet-50" title="View"><Eye size={17} /></button>
              )}
            </div>
          ))}
          {!recent.length && <p className="text-sm text-slate-400 py-3">Your uploads will appear here — start today!</p>}
        </div>
      </Card>
    </>
  );
}

/* ---------------- SONGS ---------------- */
export function SongsM({ songs }) {
  const [q, setQ] = useState("");
  const list = songs.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <SectionH title="Songbook" sub={`Songs your mentor sends land here. ${songs.length} so far.`} />
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-violet-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs" className={inputCls + " pl-10"} />
      </div>
      <SongsList songs={list} />
    </>
  );
}

/* ---------------- PAY ---------------- */
export function PayPage({ profile, say }) {
  const [amt, setAmt] = useState(200);
  const [anon, setAnon] = useState(false);
  const [name, setName] = useState(profile.name);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const quick = [50, 100, 200, 500, 1000];
  const copy = async () => {
    try { await navigator.clipboard.writeText(UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { say("Couldn't copy — long-press the UPI ID instead"); }
  };
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=Abide%20Ministry${amt ? `&am=${amt}` : ""}&cu=INR&tn=Offering`;
  const record = async () => {
    if (!amt || Number(amt) <= 0) { say("Enter an amount first"); return; }
    setBusy(true);
    try {
      await api.recordPayment({ name: anon ? null : (name.trim() || profile.name), amount: Number(amt) });
      say(anon ? "Recorded anonymously — thank you 💜" : "Thank you — your gift was recorded 💜");
    } catch (e) { say(e.message || "Couldn't record — try again"); }
    setBusy(false);
  };
  return (
    <>
      <SectionH title="Give" sub="Scan the QR or pay to the UPI ID — with your name, or quietly." />
      <div className="grid md:grid-cols-2 gap-4 items-start">
        <Card className="overflow-hidden">
          <div className="p-6 flex flex-col items-center" style={{ background: grad.hero }}>
            <div className="bg-white p-3 rounded-2xl shadow-lg"><FakeQR /></div>
            <div className="mt-4 flex items-center gap-2 bg-white/15 rounded-full pl-4 pr-1.5 py-1.5">
              <span className="text-white font-bold text-sm tracking-wide">{UPI_ID}</span>
              <button onClick={copy} className="bg-white text-violet-700 rounded-full p-1.5 hover:bg-violet-50" title="Copy UPI ID">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center px-4 py-3">Set your real UPI ID in the .env file (VITE_UPI_ID). You can also swap this pattern for your bank's QR image.</p>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-bold text-violet-900 mb-2">Amount</div>
          <div className="flex flex-wrap gap-2">
            {quick.map((v) => (
              <button key={v} onClick={() => setAmt(v)}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition ${Number(amt) === v ? "text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
                style={Number(amt) === v ? { background: grad.btn } : {}}>₹{v}</button>
            ))}
          </div>
          <div className="relative mt-3">
            <span className="absolute left-3.5 top-2.5 text-violet-400 font-bold text-sm">₹</span>
            <input type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} className={inputCls + " pl-8"} placeholder="Custom amount" />
          </div>

          <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="w-4 h-4 accent-fuchsia-600" />
            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5"><EyeOff size={15} className="text-violet-500" /> Give anonymously</span>
          </label>
          {!anon && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls + " mt-3"} />}

          <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
            <Btn as="a" href={upiLink} className="flex-1"><IndianRupee size={15} /> Open UPI app</Btn>
            <Btn kind="ghost" onClick={record} disabled={busy} className="flex-1"><CheckCircle2 size={15} /> {busy ? "Recording…" : "I've paid — record it"}</Btn>
          </div>
          <p className="text-xs text-slate-400 mt-3">Recording helps your mentor reconcile gifts. Anonymous gifts store no name and no account — not even the admin can see who gave.</p>
        </Card>
      </div>
    </>
  );
}

/* ---------------- PRAYER ---------------- */
export function PrayerM({ profile, letter, say }) {
  const [type, setType] = useState("prayer");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.addPrayer(profile.id, type, text.trim());
      setText("");
      say("Sent — your mentor has been notified 🙏");
    } catch (e) { say(e.message || "Couldn't send — try again"); }
    setBusy(false);
  };
  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#f5f0ff,#fdf0ff)" }}>
          <div className="rounded-xl flex items-center justify-center text-white shrink-0" style={{ width: 44, height: 44, background: grad.bubble }}><HeartHandshake size={20} /></div>
          <div>
            <div className="text-xs font-bold text-fuchsia-600 uppercase tracking-wide">Prayer letter</div>
            <div className="font-display text-lg font-semibold text-violet-900">{monthName}</div>
          </div>
        </div>
        {letter
          ? <p className="font-display text-violet-800 whitespace-pre-line leading-relaxed p-5 sm:p-6" style={{ fontSize: 15 }}>{letter.content}</p>
          : <p className="text-sm text-slate-400 p-5">This month's letter hasn't been published yet — check back soon.</p>}
      </Card>

      <Card className="p-5">
        <SectionH title="Send a prayer or praise" sub="Goes straight to your mentor — he's notified the moment you send it." />
        <div className="flex gap-2 mt-4">
          <button onClick={() => setType("prayer")}
            className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 transition ${type === "prayer" ? "text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
            style={type === "prayer" ? { background: grad.btn } : {}}><HeartHandshake size={15} /> Prayer point</button>
          <button onClick={() => setType("praise")}
            className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 transition ${type === "praise" ? "text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
            style={type === "praise" ? { background: "linear-gradient(135deg,#f59e0b,#d946ef)" } : {}}><Sparkles size={15} /> Praise point</button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder={type === "prayer" ? "What can we pray with you about?" : "What has God done? Share the joy!"}
          className={inputCls + " mt-3 resize-none"} />
        <div className="flex justify-end mt-3"><Btn disabled={!text.trim() || busy} onClick={send}><Send size={15} /> {busy ? "Sending…" : "Send to mentor"}</Btn></div>
      </Card>
    </>
  );
}

/* ---------------- LITERATURE (shared with admin, canPost toggles the composer) ---------------- */
export function LitFeed({ profile, posts, refresh, say, canPost }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Poetry");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const share = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    try {
      await api.addLiterature(profile.id, { title: title.trim(), type, content: content.trim() });
      setTitle(""); setContent("");
      say("Shared with the family ✨");
      refresh();
    } catch (e) { say(e.message || "Couldn't post — try again"); }
    setBusy(false);
  };
  const like = async (p) => {
    try { await api.toggleLike(profile.id, p.id, p.liked); refresh(); }
    catch (e) { say(e.message || "Couldn't do that — try again"); }
  };
  const tone = { Poetry: "pink", Reflection: "violet", Story: "amber" };
  return (
    <>
      {canPost && (
        <Card className="p-5">
          <SectionH title="Share your writing" sub="Poems, reflections, stories — encourage the family." />
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputCls + " sm:col-span-2"} />
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option>Poetry</option><option>Reflection</option><option>Story</option>
            </select>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Write here… line breaks are kept." className={inputCls + " mt-3 resize-none"} />
          <div className="flex justify-end mt-3"><Btn disabled={!title.trim() || !content.trim() || busy} onClick={share}><PenLine size={15} /> {busy ? "Sharing…" : "Share"}</Btn></div>
        </Card>
      )}
      {posts.map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex items-center gap-3">
            <Avatar name={p.author ? p.author.name : "?"} size={38} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-violet-900">{p.author ? p.author.name : "Someone"}</div>
              <div className="text-xs text-slate-400">{fmtLong(tsToKey(p.created_at))}</div>
            </div>
            <Chip tone={tone[p.type] || "violet"}>{p.type}</Chip>
          </div>
          <h3 className="font-display text-lg font-semibold text-violet-900 mt-4">{p.title}</h3>
          <p className="font-display text-violet-800 whitespace-pre-line leading-relaxed mt-2" style={{ fontSize: 15 }}>{p.content}</p>
          <div className="mt-4 pt-3 border-t border-violet-50 flex items-center">
            <button onClick={() => like(p)} className={`inline-flex items-center gap-1.5 text-sm font-bold transition ${p.liked ? "text-fuchsia-600" : "text-slate-400 hover:text-fuchsia-600"}`}>
              <Heart size={16} fill={p.liked ? "currentColor" : "none"} /> {p.likes}
            </button>
          </div>
        </Card>
      ))}
      {!posts.length && <Empty icon={BookOpen} title="Nothing shared yet" sub="Be the first to post a poem or reflection." />}
    </>
  );
}
