import React, { useState, useEffect, useRef } from "react";
import {
  Home, Upload, Music, IndianRupee, HeartHandshake, BookOpen, Bell,
  LayoutDashboard, ClipboardCheck, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { grad } from "./lib/helpers";
import * as api from "./lib/api";
import { Card, Avatar, Toast, Viewer, Spinner } from "./ui";
import Auth from "./Auth";
import { HomeM, UploadQT, SongsM, PayPage, PrayerM, LitFeed } from "./MenteePages";
import { DashA, ReviewsA, PaymentsA, PrayersA, SongsA } from "./AdminPages";

const MENTEE_NAV = [
  { k: "home", label: "Home", icon: Home },
  { k: "qt", label: "Upload QT", icon: Upload },
  { k: "songs", label: "Songs", icon: Music },
  { k: "pay", label: "Pay", icon: IndianRupee },
  { k: "prayer", label: "Prayer", icon: HeartHandshake },
  { k: "lit", label: "Literature", icon: BookOpen },
];
const ADMIN_NAV = [
  { k: "dash", label: "Dashboard", icon: LayoutDashboard },
  { k: "reviews", label: "QT Reviews", icon: ClipboardCheck },
  { k: "payments", label: "Payments", icon: IndianRupee },
  { k: "prayers", label: "Prayer Requests", icon: HeartHandshake },
  { k: "lit", label: "Literature", icon: BookOpen },
  { k: "songs", label: "Send Songs", icon: Music },
];

function FullLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white" style={{ background: grad.hero }}>
      <div className="font-display font-semibold" style={{ fontSize: 40 }}>Abide</div>
      <span className="w-6 h-6 rounded-full border-2 border-white/40 animate-spin" style={{ borderTopColor: "#fff" }} />
    </div>
  );
}

function Sidebar({ profile, isAdmin, view, go, counts, open, close, onSignOut }) {
  const nav = isAdmin ? ADMIN_NAV : MENTEE_NAV;
  const badge = (k) => (isAdmin ? (k === "reviews" ? counts.reviews : k === "prayers" ? counts.prayers : 0) : 0);
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
            <div className="text-xs text-violet-300">{isAdmin ? "Mentor · Admin" : "Mentee"}</div>
          </div>
          <button onClick={onSignOut} className="p-2 rounded-lg text-violet-300 hover:text-white hover:bg-white/10" title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
    </>
  );
}

function Header({ profile, isAdmin, title, counts, go, onMenu }) {
  const [bell, setBell] = useState(false);
  const total = isAdmin ? counts.reviews + counts.prayers : 0;
  return (
    <header className="sticky top-0 z-20 border-b border-violet-100" style={{ background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 max-w-5xl mx-auto w-full">
        <button onClick={onMenu} className="md:hidden p-2 rounded-lg text-violet-700 hover:bg-violet-50"><Menu size={20} /></button>
        <h1 className="font-display text-lg font-semibold text-violet-900 flex-1 truncate">{title}</h1>
        {isAdmin && (
          <div className="relative">
            <button onClick={() => setBell(!bell)} className="relative p-2.5 rounded-xl text-violet-700 hover:bg-violet-50">
              <Bell size={19} />
              {total > 0 && <span className="absolute text-white rounded-full font-bold text-center" style={{ top: 2, right: 2, background: "#d946ef", fontSize: 9.5, minWidth: 16, padding: "1.5px 4px" }}>{total}</span>}
            </button>
            {bell && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBell(false)} />
                <Card className="absolute right-0 mt-2 w-72 p-2 z-20 shadow-xl">
                  {total === 0 && <div className="p-3 text-sm text-slate-500 text-center">You're all caught up ✨</div>}
                  {counts.reviews > 0 && (
                    <button onClick={() => { go("reviews"); setBell(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 text-left">
                      <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 34, height: 34, background: "#fef3c7", color: "#d97706" }}><ClipboardCheck size={16} /></div>
                      <div className="text-sm font-semibold text-violet-900">{counts.reviews} QT page{counts.reviews > 1 ? "s" : ""} waiting for review</div>
                    </button>
                  )}
                  {counts.prayers > 0 && (
                    <button onClick={() => { go("prayers"); setBell(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 text-left">
                      <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 34, height: 34, background: "#fae8ff", color: "#c026d3" }}><HeartHandshake size={16} /></div>
                      <div className="text-sm font-semibold text-violet-900">{counts.prayers} new prayer point{counts.prayers > 1 ? "s" : ""}</div>
                    </button>
                  )}
                </Card>
              </>
            )}
          </div>
        )}
        <Avatar name={profile.name} size={34} />
      </div>
    </header>
  );
}

function Shell({ profile }) {
  const isAdmin = profile.role === "admin";
  const [view, setView] = useState(isAdmin ? "dash" : "home");
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [toast, setToast] = useState(null);
  const tRef = useRef(null);
  const say = (m) => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 2800); };

  // data
  const [myRows, setMyRows] = useState([]);
  const [songs, setSongs] = useState([]);
  const [letter, setLetter] = useState(null);
  const [lit, setLit] = useState([]);
  const [queue, setQueue] = useState({ pending: [], reviewed: [] });
  const [payments, setPayments] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [counts, setCounts] = useState({ reviews: 0, prayers: 0 });
  const [savingLetter, setSavingLetter] = useState(false);
  const [sendingSong, setSendingSong] = useState(false);

  const loadCounts = () => { if (isAdmin) api.fetchCounts().then(setCounts).catch(() => {}); };

  const loadFor = async (v, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      if (v === "home") {
        const [r, s, l] = await Promise.all([api.fetchMyUploads(profile.id), api.fetchSongs(), api.fetchLetter()]);
        setMyRows(r); setSongs(s); setLetter(l);
      } else if (v === "qt") setMyRows(await api.fetchMyUploads(profile.id));
      else if (v === "songs" && !isAdmin) setSongs(await api.fetchSongs());
      else if (v === "prayer") setLetter(await api.fetchLetter());
      else if (v === "lit") setLit(await api.fetchLiterature(profile.id));
      else if (v === "dash") {
        const [q, p, pr, l] = await Promise.all([api.fetchReviewQueue(), api.fetchPayments(), api.fetchPrayers(), api.fetchLiterature(profile.id)]);
        setQueue(q); setPayments(p); setPrayers(pr); setLit(l);
      } else if (v === "reviews") setQueue(await api.fetchReviewQueue());
      else if (v === "payments") setPayments(await api.fetchPayments());
      else if (v === "prayers") {
        const [pr, l] = await Promise.all([api.fetchPrayers(), api.fetchLetter()]);
        setPrayers(pr); setLetter(l);
      } else if (v === "songs" && isAdmin) setSongs(await api.fetchSongs());
    } catch (e) {
      console.error(e);
      say(e.message || "Couldn't load data — check your connection");
    }
    if (!quiet) setLoading(false);
  };

  useEffect(() => { loadFor(view); }, [view]);
  useEffect(() => { loadCounts(); }, []);

  // realtime pings
  useEffect(() => {
    if (isAdmin) {
      return api.onAdminEvents((type) => {
        loadCounts();
        say(type === "prayer" ? "New prayer point arrived 🙏" : "New QT uploaded 📖");
        const v = viewRef.current;
        if ((type === "prayer" && (v === "prayers" || v === "dash")) || (type === "upload" && (v === "reviews" || v === "dash"))) loadFor(v, true);
      });
    }
    return api.onMyReviews(profile.id, () => {
      say("Your QT was reviewed — streak grew 🔥");
      const v = viewRef.current;
      if (v === "qt" || v === "home") loadFor(v, true);
    });
  }, []);

  // actions (quiet reload keeps the page from flashing)
  const act = async (fn, ok, reloads = [view]) => {
    try {
      await fn();
      if (ok) say(ok);
      for (const v of reloads) if (v === viewRef.current) await loadFor(v, true);
      loadCounts();
    } catch (e) { say(e.message || "Something went wrong — try again"); }
  };

  const onReview = (id) => act(() => api.reviewUpload(id), "Marked reviewed — their streak just grew 🔥");
  const onRead = (id) => act(() => api.setPrayerRead(id), null);
  const onReadAll = () => act(() => api.markAllPrayersRead(), "All marked read");
  const onSaveLetter = async (content) => {
    setSavingLetter(true);
    await act(() => api.saveLetter(content), "Prayer letter published");
    setSavingLetter(false);
  };
  const onSendSong = async (title, lyrics, done) => {
    setSendingSong(true);
    await act(() => api.addSong(title, lyrics), "Song sent to all mentees 🎵");
    done && done();
    setSendingSong(false);
  };

  const nav = isAdmin ? ADMIN_NAV : MENTEE_NAV;
  const title = (nav.find((n) => n.k === view) || nav[0]).label;

  let page;
  if (loading) page = <Spinner />;
  else if (!isAdmin) {
    if (view === "home") page = <HomeM profile={profile} rows={myRows} songs={songs} letter={letter} go={setView} />;
    else if (view === "qt") page = <UploadQT profile={profile} rows={myRows} refresh={() => loadFor("qt", true)} say={say} openViewer={setViewer} />;
    else if (view === "songs") page = <SongsM songs={songs} />;
    else if (view === "pay") page = <PayPage profile={profile} say={say} />;
    else if (view === "prayer") page = <PrayerM profile={profile} letter={letter} say={say} />;
    else page = <LitFeed profile={profile} posts={lit} refresh={() => loadFor("lit", true)} say={say} canPost />;
  } else {
    if (view === "dash") page = <DashA queue={queue} payments={payments} prayers={prayers} litCount={lit.length} go={setView} onReview={onReview} openViewer={setViewer} />;
    else if (view === "reviews") page = <ReviewsA queue={queue} onReview={onReview} openViewer={setViewer} />;
    else if (view === "payments") page = <PaymentsA payments={payments} />;
    else if (view === "prayers") page = <PrayersA key={letter ? letter.updated_at : "new"} prayers={prayers} letter={letter} onSaveLetter={onSaveLetter} onRead={onRead} onReadAll={onReadAll} savingLetter={savingLetter} />;
    else if (view === "songs") page = <SongsA songs={songs} onSend={onSendSong} sending={sendingSong} />;
    else page = <LitFeed profile={profile} posts={lit} refresh={() => loadFor("lit", true)} say={say} canPost={false} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#f6f4fd" }}>
      <Sidebar profile={profile} isAdmin={isAdmin} view={view} go={setView} counts={counts}
        open={navOpen} close={() => setNavOpen(false)} onSignOut={() => supabase.auth.signOut()} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header profile={profile} isAdmin={isAdmin} title={title} counts={counts} go={setView} onMenu={() => setNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
          <div key={view + loading} className="fade-up space-y-5">{page}</div>
        </main>
      </div>
      <Viewer data={viewer} onClose={() => setViewer(null)} />
      <Toast msg={toast} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && session.user) {
      api.getProfile().then(setProfile).catch((e) => console.error("profile load failed", e));
    } else setProfile(null);
  }, [session]);

  if (session === undefined || (session && !profile)) return <FullLoader />;
  if (!session) return <Auth />;
  return <Shell key={profile.id + profile.role} profile={profile} />;
}
