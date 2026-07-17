import React, { useState } from "react";
import {
  ClipboardCheck, IndianRupee, Bell, BookOpen, Clock, CheckCircle2, Eye,
  ArrowRight, Sparkles, HeartHandshake, TrendingUp, EyeOff, Check, Send,
} from "lucide-react";
import { inputCls, fmtLong, tsToKey, monthKey, monthName } from "./lib/helpers";
import { Card, Btn, Chip, Avatar, Stat, SectionH, Empty, SongsList, PayChart } from "./ui";

const menteeName = (u) => (u.mentee ? u.mentee.name : "Mentee");
const toView = (u) => ({ name: menteeName(u), date: u.qt_date, urls: u.pageUrls || [], note: u.note });

/* ---------------- DASHBOARD ---------------- */
export function DashA({ queue, payments, prayers, litCount, go, onReview, openViewer }) {
  const pending = queue.pending;
  const unread = prayers.filter((p) => !p.is_read);
  const monthTotal = payments.filter((p) => p.paid_on.startsWith(monthKey())).reduce((s, p) => s + Number(p.amount), 0);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ClipboardCheck} label="Pending reviews" value={pending.length} tint="#d97706" bg="#fef3c7" />
        <Stat icon={IndianRupee} label="Gifts this month" value={"₹" + monthTotal.toLocaleString("en-IN")} tint="#059669" bg="#d1fae5" />
        <Stat icon={Bell} label="New prayer points" value={unread.length} tint="#c026d3" bg="#fae8ff" />
        <Stat icon={BookOpen} label="Literature posts" value={litCount} tint="#4f46e5" bg="#e0e7ff" />
      </div>

      <Card className="p-5">
        <SectionH title="Giving — last 30 days" right={<Chip tone="green">₹{monthTotal.toLocaleString("en-IN")} this month</Chip>} />
        <div className="mt-3"><PayChart payments={payments} /></div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <Card className="p-5">
          <SectionH title="Waiting for review" right={pending.length > 0 && <Chip tone="amber"><Clock size={12} /> {pending.length}</Chip>} />
          <div className="mt-2 divide-y divide-violet-50">
            {pending.slice(0, 3).map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5">
                {u.pageUrls && u.pageUrls[0]
                  ? <img src={u.pageUrls[0]} onClick={() => openViewer(toView(u))} className="w-9 h-12 object-cover rounded-md border border-violet-100 cursor-pointer hover:opacity-90" style={{ background: "#faf8ff" }} alt="" />
                  : <div className="w-9 h-12 rounded-md border border-violet-100 flex items-center justify-center text-violet-300"><BookOpen size={15} /></div>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-violet-900 truncate">{menteeName(u)}</div>
                  <div className="text-xs text-slate-400">{fmtLong(u.qt_date)}</div>
                </div>
                <Btn kind="ghost" onClick={() => onReview(u.id)} className="px-3 py-1.5"><CheckCircle2 size={14} /> Reviewed</Btn>
              </div>
            ))}
          </div>
          {pending.length === 0 && <p className="text-sm text-slate-400 mt-2">All caught up — nothing waiting.</p>}
          <button onClick={() => go("reviews")} className="mt-3 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 inline-flex items-center gap-1">Open review queue <ArrowRight size={14} /></button>
        </Card>

        <Card className="p-5">
          <SectionH title="Latest prayer points" right={unread.length > 0 && <Chip tone="pink">{unread.length} new</Chip>} />
          <div className="mt-2 divide-y divide-violet-50">
            {prayers.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-start gap-3 py-2.5">
                <Avatar name={p.author ? p.author.name : "?"} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-violet-900">{p.author ? p.author.name : "Someone"}</span>
                    {p.type === "praise" ? <Chip tone="amber"><Sparkles size={11} /> Praise</Chip> : <Chip><HeartHandshake size={11} /> Prayer</Chip>}
                    {!p.is_read && <span className="rounded-full shrink-0" style={{ width: 7, height: 7, background: "#d946ef" }} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.content}</p>
                </div>
              </div>
            ))}
            {!prayers.length && <p className="text-sm text-slate-400 py-3">Prayer and praise points from mentees will appear here.</p>}
          </div>
          <button onClick={() => go("prayers")} className="mt-3 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 inline-flex items-center gap-1">All prayer requests <ArrowRight size={14} /></button>
        </Card>
      </div>
    </>
  );
}

/* ---------------- QT REVIEW QUEUE ---------------- */
export function ReviewsA({ queue, onReview, openViewer }) {
  const { pending, reviewed } = queue;
  return (
    <>
      <SectionH title="QT review queue" sub="Open each page, then mark it reviewed — the mentee's streak updates instantly."
        right={pending.length > 0 && <Chip tone="amber"><Clock size={13} /> {pending.length} waiting</Chip>} />
      {pending.length ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {pending.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={menteeName(u)} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-violet-900">{menteeName(u)}</div>
                  <div className="text-xs text-slate-400">{fmtLong(u.qt_date)} · {u.pages.length} page{u.pages.length > 1 ? "s" : ""}</div>
                </div>
                <Chip tone="amber"><Clock size={12} /> Pending</Chip>
              </div>
              <div className="flex gap-2.5 mt-3">
                {(u.pageUrls || []).map((p, i) => (
                  <img key={i} src={p} onClick={() => openViewer(toView(u))} alt=""
                    className="w-20 h-28 object-cover rounded-lg border border-violet-100 cursor-pointer hover:opacity-90" style={{ background: "#faf8ff" }} />
                ))}
              </div>
              {u.note && <p className="text-xs text-violet-600 italic mt-2.5">“{u.note}”</p>}
              <div className="flex gap-2 mt-4">
                <Btn kind="ghost" onClick={() => openViewer(toView(u))} className="flex-1"><Eye size={15} /> View</Btn>
                <Btn onClick={() => onReview(u.id)} className="flex-1"><CheckCircle2 size={15} /> Mark reviewed</Btn>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="All caught up" sub="No QT pages waiting for review right now." />
      )}
      <Card className="p-5">
        <SectionH title="Recently reviewed" />
        <div className="mt-2 divide-y divide-violet-50">
          {reviewed.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0 text-sm font-semibold text-violet-900 truncate">{menteeName(u)}</div>
              <div className="text-xs text-slate-400">{fmtLong(u.qt_date)}</div>
              {u.pageUrls && u.pageUrls.length > 0 && (
                <button onClick={() => openViewer(toView(u))} className="p-1.5 rounded-lg text-violet-400 hover:bg-violet-50" title="View"><Eye size={16} /></button>
              )}
            </div>
          ))}
          {!reviewed.length && <p className="text-sm text-slate-400 py-3">Reviewed pages will appear here.</p>}
        </div>
      </Card>
    </>
  );
}

/* ---------------- PAYMENTS ---------------- */
export function PaymentsA({ payments }) {
  const monthTotal = payments.filter((p) => p.paid_on.startsWith(monthKey())).reduce((s, p) => s + Number(p.amount), 0);
  const top = payments.reduce((m, p) => Math.max(m, Number(p.amount)), 0);
  const anonCount = payments.filter((p) => !p.giver_name).length;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={IndianRupee} label="This month" value={"₹" + monthTotal.toLocaleString("en-IN")} tint="#059669" bg="#d1fae5" />
        <Stat icon={TrendingUp} label="Gifts recorded" value={payments.length} />
        <Stat icon={Sparkles} label="Largest gift" value={"₹" + top.toLocaleString("en-IN")} tint="#c026d3" bg="#fae8ff" />
        <Stat icon={EyeOff} label="Anonymous" value={anonCount} tint="#64748b" bg="#f1f5f9" />
      </div>
      <Card className="p-5">
        <SectionH title="Giving — last 30 days" />
        <div className="mt-3"><PayChart payments={payments} height={260} /></div>
      </Card>
      <Card className="p-5">
        <SectionH title="All gifts" sub="Anonymous gifts store no name and no account — that privacy is built into the database." />
        <div className="mt-2 divide-y divide-violet-50">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5">
              {p.giver_name ? <Avatar name={p.giver_name} size={34} /> : (
                <div className="rounded-full flex items-center justify-center bg-slate-100 text-slate-500 shrink-0" style={{ width: 34, height: 34 }}><EyeOff size={15} /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${p.giver_name ? "text-violet-900" : "text-slate-500 italic"}`}>{p.giver_name || "Anonymous"}</div>
                <div className="text-xs text-slate-400">{fmtLong(p.paid_on)}</div>
              </div>
              <div className="text-sm font-extrabold text-violet-900">₹{Number(p.amount).toLocaleString("en-IN")}</div>
            </div>
          ))}
          {!payments.length && <p className="text-sm text-slate-400 py-3">Recorded gifts will appear here.</p>}
        </div>
      </Card>
    </>
  );
}

/* ---------------- PRAYER REQUESTS + LETTER ---------------- */
export function PrayersA({ prayers, letter, onSaveLetter, onRead, onReadAll, savingLetter }) {
  const [draft, setDraft] = useState(letter ? letter.content : "");
  const unread = prayers.filter((p) => !p.is_read).length;
  return (
    <>
      <Card className="p-5">
        <SectionH title={"Prayer letter · " + monthName} sub="Every mentee sees this on their Prayer page the moment you publish." />
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12}
          placeholder={"Dear family,\n\nGIVE THANKS\n· …\n\nPLEASE PRAY\n· …"}
          className={inputCls + " mt-4 resize-none font-display"} style={{ fontSize: 14.5, lineHeight: 1.65 }} />
        <div className="flex justify-end mt-3">
          <Btn disabled={savingLetter || !draft.trim() || draft === (letter ? letter.content : "")} onClick={() => onSaveLetter(draft)}>
            <Send size={15} /> {savingLetter ? "Publishing…" : "Publish letter"}
          </Btn>
        </div>
      </Card>

      <Card className="p-5">
        <SectionH title="Prayer & praise points" sub="Sent by mentees — you're pinged the moment they arrive."
          right={unread > 0 && <Btn kind="ghost" onClick={onReadAll}><Check size={15} /> Mark all read</Btn>} />
        <div className="mt-3 space-y-2.5">
          {prayers.map((p) => (
            <div key={p.id} className={`rounded-xl border p-3.5 flex gap-3 ${p.is_read ? "border-violet-100 bg-white" : "border-fuchsia-200 bg-violet-50"}`}>
              <Avatar name={p.author ? p.author.name : "?"} size={34} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-violet-900">{p.author ? p.author.name : "Someone"}</span>
                  {p.type === "praise" ? <Chip tone="amber"><Sparkles size={12} /> Praise</Chip> : <Chip><HeartHandshake size={12} /> Prayer</Chip>}
                  <span className="text-xs text-slate-400">{fmtLong(tsToKey(p.created_at))}</span>
                  {!p.is_read && <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: "#d946ef" }} />}
                </div>
                <p className="text-sm text-slate-600 mt-1">{p.content}</p>
              </div>
              {!p.is_read && <button onClick={() => onRead(p.id)} className="self-start p-2 rounded-lg text-violet-500 hover:bg-white" title="Mark read"><Check size={16} /></button>}
            </div>
          ))}
          {!prayers.length && <p className="text-sm text-slate-400">Nothing yet — points from mentees will land here.</p>}
        </div>
      </Card>
    </>
  );
}

/* ---------------- SEND SONGS ---------------- */
export function SongsA({ songs, onSend, sending }) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const send = () => {
    if (!title.trim() || !lyrics.trim()) return;
    onSend(title.trim(), lyrics.trim(), () => { setTitle(""); setLyrics(""); });
  };
  return (
    <>
      <Card className="p-5">
        <SectionH title="Send a new song" sub="Lands in every mentee's songbook with a ‘New’ tag." />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className={inputCls + " mt-4"} />
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={8}
          placeholder="Type or paste the lyrics — line breaks are kept exactly as you write them."
          className={inputCls + " mt-3 resize-none font-display"} style={{ fontSize: 14.5, lineHeight: 1.65 }} />
        <div className="flex justify-end mt-3">
          <Btn disabled={!title.trim() || !lyrics.trim() || sending} onClick={send}><Send size={15} /> {sending ? "Sending…" : "Send to all mentees"}</Btn>
        </div>
      </Card>
      <SectionH title={"Sent songs · " + songs.length} />
      <SongsList songs={songs} />
    </>
  );
}
