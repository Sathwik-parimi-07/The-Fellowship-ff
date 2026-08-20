import React, { useState, useEffect, useRef } from "react";
import {
  Home, Upload, Music, HeartHandshake, BookOpen, Bell, MessagesSquare,
  Megaphone, Users, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { grad, timeAgo, ROLE_LABEL } from "./lib/helpers";
import * as api from "./lib/api";
import { Card, Avatar, Toast, Viewer, Spinner } from "./ui";
import Auth from "./Auth";
import { HomeM, UploadQT, ThreadsPage, SongsM, PrayerM, LitFeed } from "./MenteePages";
import { MusicDesk, PrayerDesk, AnnouncePage, PeoplePage } from "./AdminPages";

const TITLES = {
  home: "Home", qt: "Upload QT", threads: "Mentorship", songs: "Songs", prayer: "Prayer",
  lit: "Literature", music: "Music Desk", prayerdesk: "Prayer Desk", announce: "Announce", people: "People",
};

function navFor(role) {
  const base = [
    { k: "home", label: "Home", icon: Home },
    { k: "qt", label: "Upload QT", icon: Upload },
    { k: "threads", label: "Mentorship", icon: MessagesSquare },
    { k: "songs", label: "Songs", icon: Music },
    { k: "prayer", label: "Prayer", icon: HeartHandshake },
    { k: "lit", label: "Literature", icon: BookOpen },
  ];
  if (role === "music_secretary") base.push({ k: "music", label: "Music Desk", icon: Music });
  if (role === "prayer_secretary") base.push({ k: "prayerdesk", label: "Prayer Desk", icon: HeartHandshake });
  if (role === "president") base.push(
    { k: "announce", label: "Announce", icon: Megaphone },
    { k: "people", label: "People", icon: Users },
  );
  return base;
}

function FullLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white" style={{ background: grad.hero }}>
      <div className="font-display font-semibold" style={{ fontSize: 40 }}>Abide</div>
      <span className="w-6 h-6 rounded-full border-2 border-white/40 animate-spin" style={{ borderTopColor: "#fff" }} />
    </div>
  );
}

function Sidebar({ profile, view, go, badges, open, close, onSignOut }) {
  const nav = navFor(profile.role);
  const badge = (k) => (k === "threads" ? badges.pending : k === "prayerdesk" ? badges.prayers : 0);
  return (
    <>
      {open && <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(18,8,42,.55)" }} onClick={close} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`} style={{ background: grad.side }}>
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <div className="rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ width: 42, height: 42, background: grad.bubble }}><BookOpen size={20} /></div>
          <div>
            <div className="font-display text-xl font-semibold text-white leading-none">Abide</div>
            <div className="text-violet-300 font-bold mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>QT · MENTORSHIP</div>
          </div>
          <button onClick={close} className="ml-auto md:hidden text-violet-300 p-1.5 hover:text-white"><X size={18} /></button>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {nav.map((n) => {
            const active = view === n.k;
            const b = badge(n.k);
            return (
              <button key={n.k} onClick={() => { go(n.k); close(); }}
                className={`relative flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition ${active ? "text-white" : "text-violet-200 hover:text-white hover:bg-white/10"}`}
                style={active ? { background: "rgba(255,255,255,.14)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)" } : {}}>
                {active && <span className="absolute rounded-full" style={{ left: 0, top: 8, bottom: 8, width: 4, background: "linear-gradient(#e879f9,#a78bfa)" }} />}
                <n.icon size={18} strokeWidth={2.2} className="shrink-0" />
                <span className="flex-1 text-left">{n.label}</span>
                {b > 0 && <span className="text-white rounded-full font-bold text-center" style={{ background: "#d946ef", fontSize: 10, minWidth: 19, padding: "2.5px 5px" }}>{b}</span>}
              </button>
            );
          })}
        </nav>
        <div className="m-3 p-3 rounded-2xl flex items-center gap-3" style={{ background: "rgba(255,255,255,.08)" }}>
          <Avatar name={profile.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{profile.name}</div>
            <div className="text-xs text-violet-300">{ROLE_LABEL[profile.role] || "Member"}</div>
          </div>
          <button onClick={onSignOut} className="p-2 rounded-lg text-violet-300 hover:text-white hover:bg-white/10" title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
    </>
  );
}

function Header({ profile, title, annList, annUnseen, onOpenBell, onMenu }) {
  const [bell, setBell] = useState(false);
  const toggle = () => { const next = !bell; setBell(next); if (next) onOpenBell(); };
  return (
    <header className="sticky top-0 z-20 border-b border-violet-100" style={{ background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 max-w-5xl mx-auto w-full">
        <button onClick={onMenu} className="md:hidden p-2 rounded-lg text-violet-700 hover:bg-violet-50"><Menu size={20} /></button>
        <h1 className="font-display text-lg font-semibold text-violet-900 flex-1 truncate">{title}</h1>
        <div className="relative">
          <button onClick={toggle} className="relative p-2.5 rounded-xl text-violet-700 hover:bg-violet-50">
            <Bell size={19} />
            {annUnseen > 0 && <span className="absolute text-white rounded-full font-bold text-center" style={{ top: 2, right: 2, background: "#d946ef", fontSize: 9.5, minWidth: 16, padding: "1.5px 4px" }}>{annUnseen}</span>}
          </button>
          {bell && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBell(false)} />
              <Card className="absolute right-0 mt-2 w-80 p-2 z-20 shadow-xl max-h-96 overflow-y-auto">
                <div className="px-3 pt-2 pb-1 text-xs font-bold text-fuchsia-600 uppercase tracking-wide">Announcements</div>
                {annList.length === 0 && <div className="p-3 text-sm text-slate-500 text-center">Nothing yet — announcements from the President appear here.</div>}
                {annList.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl hover:bg-violet-50">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 30, height: 30, background: "#fae8ff", color: "#c026d3" }}><Megaphone size={14} /></div>
                      <div className="text-sm font-bold text-violet-900 flex-1 truncate">{a.title}</div>
                      <span className="text-xs text-slate-400 shrink-0">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-pre-line mt-1.5">{a.content}</p>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
        <Avatar name={profile.name} size={34} />
      </div>
    </header>
  );
}

/* ================= SHELL ================= */
function Shell({ profile }) {
  const [view, setView] = useState("home");
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [relations, setRelations] = useState({ mentor: null, mentees: [] });
  const [annList, setAnnList] = useState([]);
  const [badges, setBadges] = useState({ pending: 0, prayers: 0 });
  const [annUnseen, setAnnUnseen] = useState(0);

  const [myRows, setMyRows] = useState([]);
  const [songs, setSongs] = useState([]);
  const [letter, setLetter] = useState(null);
  const [lit, setLit] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [people, setPeople] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [sending, setSending] = useState(false);

  const viewRef = useRef(view);
  viewRef.current = view;
  const relRef = useRef(relations);
  relRef.current = relations;

  const isPrayerSec = profile.role === "prayer_secretary";
  const seenKey = "abide-ann-seen-" + profile.id;

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 3400); };

  const computeAnnUnseen = (list) => {
    const seen = Number(localStorage.getItem(seenKey) || 0);
    setAnnUnseen(list.filter((a) => new Date(a.created_at).getTime() > seen).length);
  };
  const openBell = () => { localStorage.setItem(seenKey, String(Date.now())); setAnnUnseen(0); };

  const refreshPending = async (rel) => {
    const r = rel || relRef.current;
    const counts = await api.fetchPendingCounts(r.mentees.map((m) => m.id));
    setPendingCounts(counts);
    setBadges((b) => ({ ...b, pending: Object.values(counts).reduce((a, c) => a + c, 0) }));
  };
  const refreshPrayerBadge = async () => {
    if (!isPrayerSec) return;
    try { const n = await api.fetchUnreadPrayerCount(); setBadges((b) => ({ ...b, prayers: n })); } catch {}
  };
  const refreshAnnouncements = async () => {
    try { const a = await api.fetchAnnouncements(); setAnnList(a); computeAnnUnseen(a); return a; } catch { return []; }
  };

  const loadFor = async (v, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      if (v === "home") {
        const [r, s, l, a] = await Promise.all([api.fetchMyUploads(profile.id), api.fetchSongs(), api.fetchLetter(), api.fetchAnnouncements()]);
        setMyRows(r); setSongs(s); setLetter(l); setAnnList(a); computeAnnUnseen(a);
      } else if (v === "qt") setMyRows(await api.fetchMyUploads(profile.id));
      else if (v === "threads") await refreshPending();
      else if (v === "songs" || v === "music") setSongs(await api.fetchSongs());
      else if (v === "prayer") setLetter(await api.fetchLetter());
      else if (v === "lit") setLit(await api.fetchLiterature(profile.id));
      else if (v === "prayerdesk") {
        const [p, l] = await Promise.all([api.fetchPrayers(), api.fetchLetter()]);
        setPrayers(p); setLetter(l);
        refreshPrayerBadge();
      } else if (v === "announce") {
        const [a, pp] = await Promise.all([api.fetchAnnouncements(), api.fetchPeople()]);
        setAnnList(a); computeAnnUnseen(a); setPeople(pp);
      } else if (v === "people") {
        const [pp, mm] = await Promise.all([api.fetchPeople(), api.fetchAllMentorships()]);
        setPeople(pp); setMentorships(mm);
      }
    } catch (e) { say(e.message || "Couldn't load — pull to refresh"); }
    if (!quiet) setLoading(false);
  };

  const go = (v) => { setView(v); loadFor(v); };

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const rel = await api.fetchRelations(profile.id);
        setRelations(rel);
        await loadFor("home");
        await refreshPending(rel);
        await refreshPrayerBadge();
        unsub = api.subscribeAll(
          {
            uid: profile.id,
            isPrayerSec,
            mentorId: rel.mentor ? rel.mentor.id : null,
            menteeIds: rel.mentees.map((m) => m.id),
          },
          {
            menteeQT: (authorId) => {
              const who = relRef.current.mentees.find((m) => m.id === authorId);
              say(`New QT from ${who ? who.name : "your mentee"} 📖`);
              refreshPending();
              if (viewRef.current === "threads") loadFor("threads", true);
            },
            mentorQT: () => {
              say("Your mentor shared today's QT 🌿");
              if (viewRef.current === "threads") loadFor("threads", true);
            },
            reviewed: () => {
              say("Your QT was reviewed — streak grew 🔥");
              if (viewRef.current === "qt" || viewRef.current === "home") loadFor(viewRef.current, true);
            },
            prayer: () => {
              say("New prayer point arrived 🙏");
              refreshPrayerBadge();
              if (viewRef.current === "prayerdesk") loadFor("prayerdesk", true);
            },
            announce: async () => {
              const a = await refreshAnnouncements();
              const latest = a[0];
              say(latest ? `Announcement: ${latest.title}` : "New announcement 📣");
              if (viewRef.current === "home" || viewRef.current === "announce") loadFor(viewRef.current, true);
            },
          }
        );
      } catch (e) { say(e.message || "Couldn't load your data"); setLoading(false); }
    })();
    return () => unsub();
  }, []);

  /* ---------- role actions ---------- */
  const act = async (fn, okMsg, after) => {
    setSending(true);
    try { await fn(); okMsg && say(okMsg); after && after(); }
    catch (e) { say(e.message || "Something went wrong"); }
    setSending(false);
  };
  const onSendSong = (title, lyrics, reset) =>
    act(() => api.addSong(title, lyrics), "Song sent to everyone 🎵", () => { reset(); loadFor("music", true); });
  const onSaveLetter = (content) =>
    act(() => api.saveLetter(content), "Letter published 💌", () => loadFor("prayerdesk", true));
  const onRead = async (id) => { try { await api.setPrayerRead(id); loadFor("prayerdesk", true); refreshPrayerBadge(); } catch (e) { say(e.message); } };
  const onReadAll = async () => { try { await api.markAllPrayersRead(); loadFor("prayerdesk", true); refreshPrayerBadge(); } catch (e) { say(e.message); } };
  const onSendAnnouncement = (payload, reset) =>
    act(() => api.addAnnouncement(profile.id, payload), payload.audience === "all" ? "Announced to everyone 📣" : "Sent to the people you picked 📣", () => { reset(); loadFor("announce", true); });
  const onSetRole = (person, role) =>
    act(() => api.setRole(person.id, role), `${person.name} is now ${ROLE_LABEL[role]}`, () => loadFor("people", true));
  const onSetMentor = (person, mentorId) =>
    act(async () => {
      await api.setMentor(person.id, mentorId);
      const rel = await api.fetchRelations(profile.id);
      setRelations(rel);
      refreshPending(rel);
    }, mentorId ? `Mentor updated for ${person.name}` : `${person.name} is now top of their chain`, () => loadFor("people", true));
  const onAfterReview = () => refreshPending();

  const openViewer = (d) => setViewer(d);

  return (
    <div className="min-h-screen" style={{ background: "#f6f4fd" }}>
      <Sidebar profile={profile} view={view} go={go} badges={badges} open={menu} close={() => setMenu(false)}
        onSignOut={() => supabase.auth.signOut()} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header profile={profile} title={TITLES[view]} annList={annList} annUnseen={annUnseen} onOpenBell={openBell} onMenu={() => setMenu(true)} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {loading ? <Spinner /> : (
            <>
              {view === "home" && <HomeM profile={profile} rows={myRows} songs={songs} letter={letter} announcements={annList} relations={relations} go={go} />}
              {view === "qt" && <UploadQT profile={profile} rows={myRows} mentorName={relations.mentor ? relations.mentor.name : null} refresh={() => loadFor("qt", true)} say={say} openViewer={openViewer} />}
              {view === "threads" && <ThreadsPage profile={profile} relations={relations} pendingCounts={pendingCounts} say={say} openViewer={openViewer} onAfterReview={onAfterReview} />}
              {view === "songs" && <SongsM songs={songs} />}
              {view === "prayer" && <PrayerM profile={profile} letter={letter} say={say} />}
              {view === "lit" && <LitFeed profile={profile} posts={lit} refresh={() => loadFor("lit", true)} say={say} />}
              {view === "music" && <MusicDesk songs={songs} onSend={onSendSong} sending={sending} />}
              {view === "prayerdesk" && <PrayerDesk key={letter ? letter.updated_at : "empty"} prayers={prayers} letter={letter} onSaveLetter={onSaveLetter} onRead={onRead} onReadAll={onReadAll} savingLetter={sending} />}
              {view === "announce" && <AnnouncePage profile={profile} people={people} announcements={annList} onSend={onSendAnnouncement} sending={sending} />}
              {view === "people" && <PeoplePage profile={profile} people={people} mentorships={mentorships} onSetRole={onSetRole} onSetMentor={onSetMentor} />}
            </>
          )}
        </main>
      </div>
      <Toast msg={toast} />
      <Viewer data={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}

/* ================= AUTH GATE ================= */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    let tries = 0;
    const grab = async () => {
      try {
        const p = await api.getProfile();
        if (p) { setProfile(p); return; }
      } catch {}
      if (++tries < 6) setTimeout(grab, 700); // profile row is created by a DB trigger just after signup
    };
    grab();
  }, [session]);

  if (session === undefined) return <FullLoader />;
  if (!session) return <Auth />;
  if (!profile) return <FullLoader />;
  return <Shell key={profile.id + profile.role} profile={profile} />;
}
