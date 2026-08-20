import React, { useState } from "react";
import {
  HeartHandshake, Sparkles, Check, Send, Megaphone, Users, ShieldCheck,
} from "lucide-react";
import { inputCls, fmtLong, tsToKey, timeAgo, monthName, ROLE_LABEL } from "./lib/helpers";
import { Card, Btn, Chip, Avatar, SectionH, Empty, SongsList } from "./ui";

/* ================= MUSIC DESK (Music Secretary) ================= */
export function MusicDesk({ songs, onSend, sending }) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const send = () => {
    if (!title.trim() || !lyrics.trim()) return;
    onSend(title.trim(), lyrics.trim(), () => { setTitle(""); setLyrics(""); });
  };
  return (
    <>
      <Card className="p-5">
        <SectionH title="Send a new song" sub="Lands in everyone's songbook with a ‘New’ tag — only you can do this." />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className={inputCls + " mt-4"} />
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={8}
          placeholder="Type or paste the lyrics — line breaks are kept exactly as you write them."
          className={inputCls + " mt-3 resize-none font-display"} style={{ fontSize: 14.5, lineHeight: 1.65 }} />
        <div className="flex justify-end mt-3">
          <Btn disabled={!title.trim() || !lyrics.trim() || sending} onClick={send}><Send size={15} /> {sending ? "Sending…" : "Send to everyone"}</Btn>
        </div>
      </Card>
      <SectionH title={"Sent songs · " + songs.length} />
      <SongsList songs={songs} />
    </>
  );
}

/* ================= PRAYER DESK (Prayer Secretary) ================= */
export function PrayerDesk({ prayers, letter, onSaveLetter, onRead, onReadAll, savingLetter }) {
  const [draft, setDraft] = useState(letter ? letter.content : "");
  const unread = prayers.filter((p) => !p.is_read).length;
  return (
    <>
      <Card className="p-5">
        <SectionH title={"Prayer letter · " + monthName} sub="Everyone sees this on their Prayer page the moment you publish." />
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
        <SectionH title="Prayer & praise points" sub="Sent by the family — you're pinged the moment they arrive."
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
          {!prayers.length && <p className="text-sm text-slate-400">Nothing yet — points from the family will land here.</p>}
        </div>
      </Card>
    </>
  );
}

/* ================= ANNOUNCE (President) ================= */
export function AnnouncePage({ profile, people, announcements, onSend, sending }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all");
  const [picked, setPicked] = useState([]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const others = people.filter((p) => p.id !== profile.id);
  const canSend = title.trim() && content.trim() && (audience === "all" || picked.length > 0) && !sending;
  const send = () => onSend({ title: title.trim(), content: content.trim(), audience, recipientIds: picked }, () => {
    setTitle(""); setContent(""); setAudience("all"); setPicked([]);
  });
  const seg = (v, label) => (
    <button onClick={() => setAudience(v)}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${audience === v ? "text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
      style={audience === v ? { background: "linear-gradient(135deg,#7c3aed,#c026d3)" } : {}}>
      {label}
    </button>
  );
  return (
    <>
      <Card className="p-5">
        <SectionH title="Send an announcement" sub="A meet, a change of plan, a word for the family — it pings everyone you choose, instantly." />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — e.g. Saturday meet at 5 PM" className={inputCls + " mt-4"} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
          placeholder="Details… (venue, time, what to bring)" className={inputCls + " mt-3 resize-none"} />
        <div className="flex gap-2 mt-4">{seg("all", "Everyone")}{seg("some", "Choose people")}</div>
        {audience === "some" && (
          <div className="mt-3 grid sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {others.map((p) => (
              <label key={p.id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer select-none transition ${picked.includes(p.id) ? "border-fuchsia-300 bg-violet-50" : "border-violet-100 hover:bg-violet-50"}`}>
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 accent-fuchsia-600" />
                <Avatar name={p.name} size={26} />
                <span className="text-sm font-semibold text-violet-900 truncate">{p.name}</span>
              </label>
            ))}
            {!others.length && <p className="text-sm text-slate-400 p-2">No one else has signed up yet.</p>}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <p className="text-xs text-slate-400">{audience === "all" ? "Every member will see this." : `${picked.length} selected.`}</p>
          <Btn disabled={!canSend} onClick={send}><Megaphone size={15} /> {sending ? "Sending…" : "Send announcement"}</Btn>
        </div>
      </Card>

      <SectionH title="Sent" />
      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-violet-900">{a.title}</span>
              <Chip tone={a.audience === "all" ? "violet" : "pink"}>{a.audience === "all" ? "Everyone" : "Selected people"}</Chip>
              <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-line mt-1.5">{a.content}</p>
          </Card>
        ))}
        {!announcements.length && <Empty icon={Megaphone} title="Nothing sent yet" sub="Your announcements will be listed here." />}
      </div>
    </>
  );
}

/* ================= PEOPLE (President) ================= */
export function PeoplePage({ profile, people, mentorships, onSetRole, onSetMentor }) {
  const mentorOf = {};
  mentorships.forEach((m) => { mentorOf[m.mentee_id] = m.mentor_id; });
  const menteeCount = {};
  mentorships.forEach((m) => { menteeCount[m.mentor_id] = (menteeCount[m.mentor_id] || 0) + 1; });

  return (
    <>
      <SectionH title="People & pairs" sub="Assign each person's mentor and role. Threads appear for both people the moment you pair them." />
      <Card className="p-2 sm:p-3">
        <div className="divide-y divide-violet-50">
          {people.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={p.name} size={40} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-violet-900 truncate">
                    {p.name} {p.id === profile.id && <span className="text-xs font-semibold text-fuchsia-500">(you)</span>}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    {p.role !== "member" && <ShieldCheck size={12} className="text-fuchsia-500" />}
                    {ROLE_LABEL[p.role] || p.role}
                    {menteeCount[p.id] ? ` · mentors ${menteeCount[p.id]}` : ""}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-96">
                <label className="block">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">Role</span>
                  <select value={p.role} onChange={(e) => onSetRole(p, e.target.value)} className={inputCls + " mt-1 py-2"}>
                    <option value="member">Member</option>
                    <option value="music_secretary">Music Secretary</option>
                    <option value="prayer_secretary">Prayer Secretary</option>
                    <option value="president">President</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">Mentor</span>
                  <select value={mentorOf[p.id] || ""} onChange={(e) => onSetMentor(p, e.target.value || null)} className={inputCls + " mt-1 py-2"}>
                    <option value="">— none —</option>
                    {people.filter((x) => x.id !== p.id).map((x) => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
          {!people.length && <p className="text-sm text-slate-400 p-4">No sign-ups yet.</p>}
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: "#f3eefe", color: "#7c3aed" }}><Users size={17} /></div>
          <p className="text-sm text-slate-500">
            Each person can have <b>one mentor</b> and any number of mentees — that's how the chain grows: a mentee can become a mentor while still keeping QT with their own mentor. People with no mentor sit at the top of a chain, and their QTs count automatically.
          </p>
        </div>
      </Card>
    </>
  );
}
