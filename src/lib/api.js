import { supabase } from "./supabase";
import { daysAgo, todayKey, monthKey, shrinkImage } from "./helpers";

/* ---------------- profile ---------------- */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

/* ---------------- relations (my mentor + my mentees) ---------------- */
export async function fetchRelations(uid) {
  const { data, error } = await supabase
    .from("mentorships")
    .select("id, mentor_id, mentee_id, mentor:profiles!mentorships_mentor_id_fkey(id, name), mentee:profiles!mentorships_mentee_id_fkey(id, name)")
    .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`);
  if (error) throw error;
  const mine = data.find((r) => r.mentee_id === uid);
  return {
    mentor: mine ? mine.mentor : null,
    mentees: data.filter((r) => r.mentor_id === uid).map((r) => r.mentee),
  };
}

/* ---------------- signed URLs for private QT photos ---------------- */
async function signPages(rows) {
  const paths = rows.flatMap((r) => r.pages || []);
  if (!paths.length) return rows;
  const { data, error } = await supabase.storage.from("qt-pages").createSignedUrls(paths, 3600);
  if (error) throw error;
  const map = {};
  data.forEach((d, i) => { if (d.signedUrl) map[d.path || paths[i]] = d.signedUrl; });
  return rows.map((r) => ({ ...r, pageUrls: (r.pages || []).map((p) => map[p]).filter(Boolean) }));
}

/* ---------------- QT: mine ---------------- */
export async function fetchMyUploads(uid) {
  const { data, error } = await supabase
    .from("qt_uploads")
    .select("id, qt_date, status, note, pages")
    .eq("author_id", uid)
    .gte("qt_date", daysAgo(130))
    .order("qt_date", { ascending: false });
  if (error) throw error;
  const recent = await signPages(data.slice(0, 8));
  return [...recent, ...data.slice(8)];
}

export async function uploadQT(uid, files, note) {
  const date = todayKey();
  const pages = [];
  const toSend = files.slice(0, 2);
  for (let i = 0; i < toSend.length; i++) {
    const blob = await shrinkImage(toSend[i]);
    const path = `${uid}/${date}-p${i + 1}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("qt-pages").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    pages.push(path);
  }
  const { error } = await supabase.from("qt_uploads").insert({ author_id: uid, qt_date: date, pages, note });
  if (error) throw error;
}

/* ---------------- QT: a thread between me and one other person ---------------- */
export async function fetchThread(meId, otherId) {
  const { data, error } = await supabase
    .from("qt_uploads")
    .select("id, author_id, qt_date, status, note, pages, created_at")
    .in("author_id", [meId, otherId])
    .order("qt_date", { ascending: false })
    .limit(40);
  if (error) throw error;
  const signed = await signPages(data);
  return signed.reverse(); // oldest first, like a chat
}

export async function reviewUpload(id) {
  const { error } = await supabase
    .from("qt_uploads")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* pending count per mentee (for badges + thread list) */
export async function fetchPendingCounts(menteeIds) {
  if (!menteeIds.length) return {};
  const { data, error } = await supabase
    .from("qt_uploads")
    .select("author_id")
    .in("author_id", menteeIds)
    .eq("status", "pending");
  if (error) throw error;
  const counts = {};
  data.forEach((r) => { counts[r.author_id] = (counts[r.author_id] || 0) + 1; });
  return counts;
}

/* ---------------- songs ---------------- */
export async function fetchSongs() {
  const { data, error } = await supabase.from("songs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addSong(title, lyrics) {
  const { error } = await supabase.from("songs").insert({ title, lyrics });
  if (error) throw error;
}

/* ---------------- prayers (to the Prayer Secretary) ---------------- */
export async function addPrayer(uid, type, content) {
  const { error } = await supabase.from("prayers").insert({ author_id: uid, type, content });
  if (error) throw error;
}
export async function fetchPrayers() {
  const { data, error } = await supabase
    .from("prayers")
    .select("*, author:profiles(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
export async function setPrayerRead(id) {
  const { error } = await supabase.from("prayers").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}
export async function markAllPrayersRead() {
  const { error } = await supabase.from("prayers").update({ is_read: true }).eq("is_read", false);
  if (error) throw error;
}
export async function fetchUnreadPrayerCount() {
  const { count, error } = await supabase
    .from("prayers")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/* ---------------- prayer letter ---------------- */
export async function fetchLetter() {
  const { data, error } = await supabase.from("prayer_letters").select("*").eq("month", monthKey()).maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveLetter(content) {
  const { error } = await supabase
    .from("prayer_letters")
    .upsert({ month: monthKey(), content, updated_at: new Date().toISOString() }, { onConflict: "month" });
  if (error) throw error;
}

/* ---------------- announcements ---------------- */
export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*, author:profiles(name)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}
export async function addAnnouncement(uid, { title, content, audience, recipientIds }) {
  const { data, error } = await supabase
    .from("announcements")
    .insert({ author_id: uid, title, content, audience })
    .select("id")
    .single();
  if (error) throw error;
  if (audience === "some" && recipientIds.length) {
    const rows = recipientIds.map((user_id) => ({ announcement_id: data.id, user_id }));
    const { error: e2 } = await supabase.from("announcement_recipients").insert(rows);
    if (e2) throw e2;
  }
}

/* ---------------- literature ---------------- */
export async function fetchLiterature(uid) {
  const { data, error } = await supabase
    .from("literature")
    .select("*, author:profiles(name), literature_likes(user_id)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((p) => ({
    ...p,
    likes: p.literature_likes.length,
    liked: p.literature_likes.some((l) => l.user_id === uid),
  }));
}
export async function addLiterature(uid, post) {
  const { error } = await supabase.from("literature").insert({ author_id: uid, ...post });
  if (error) throw error;
}
export async function toggleLike(uid, postId, liked) {
  const q = liked
    ? supabase.from("literature_likes").delete().match({ post_id: postId, user_id: uid })
    : supabase.from("literature_likes").insert({ post_id: postId, user_id: uid });
  const { error } = await q;
  if (error) throw error;
}

/* ---------------- people & pairs (President) ---------------- */
export async function fetchPeople() {
  const { data, error } = await supabase.from("profiles").select("*").order("name");
  if (error) throw error;
  return data;
}
export async function fetchAllMentorships() {
  const { data, error } = await supabase.from("mentorships").select("id, mentor_id, mentee_id");
  if (error) throw error;
  return data;
}
export async function setRole(targetId, role) {
  const { error } = await supabase.rpc("set_role", { p_target: targetId, p_role: role });
  if (error) throw error;
}
export async function setMentor(menteeId, mentorId) {
  const { error } = await supabase.rpc("set_mentor", { p_mentee: menteeId, p_mentor: mentorId });
  if (error) throw error;
}

/* ---------------- realtime ---------------- */
/**
 * One subscription for the whole session.
 * handlers: { menteeQT(authorId), mentorQT(), reviewed(), prayer(), announce() }
 */
export function subscribeAll({ uid, isPrayerSec, mentorId, menteeIds }, handlers) {
  const ch = supabase
    .channel("abide-live-" + uid)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "qt_uploads" }, (p) => {
      const a = p.new.author_id;
      if (a === uid) return;
      if (menteeIds.includes(a)) handlers.menteeQT && handlers.menteeQT(a);
      else if (a === mentorId) handlers.mentorQT && handlers.mentorQT();
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "qt_uploads", filter: `author_id=eq.${uid}` }, (p) => {
      if (p.new.status === "reviewed") handlers.reviewed && handlers.reviewed();
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, () => {
      handlers.announce && handlers.announce();
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcement_recipients", filter: `user_id=eq.${uid}` }, () => {
      handlers.announce && handlers.announce();
    });
  if (isPrayerSec) {
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "prayers" }, () => {
      handlers.prayer && handlers.prayer();
    });
  }
  ch.subscribe();
  return () => supabase.removeChannel(ch);
}
